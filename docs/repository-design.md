# Repository Layer Design

## Overview

After implementing the auth, workspace, and service modules, we performed a comprehensive review of all repository layers. This document captures the improvements made and the rationale behind each decision.

## `withActive` Helper: Centralized Soft-Delete Filtering

Every query on a soft-deletable table must include `AND deleted_at IS NULL`. Before the improvement, this was written inline in every repository method:

```typescript
// Before: repeated in every query
.where(and(eq(services.id, id), isNull(services.deletedAt)))
```

We introduced a centralized helper:

```typescript
// apps/api/src/db/helpers.ts
export function withActive<T extends { deletedAt: SQLWrapper }>(
  table: T,
  ...conditions: (SQL | undefined)[]
): SQL {
  return and(...conditions, isNull(table.deletedAt))!;
}
```

### Usage

```typescript
// After: clean and consistent
.where(withActive(services, eq(services.id, id), eq(services.workspaceId, workspaceId)))
```

### Why a helper instead of inline?

- **Single point of change:** If the soft-delete strategy changes (e.g., using a boolean `is_deleted` instead of `deleted_at`), only one function needs to be updated.
- **Prevents mistakes:** Without the helper, it's easy to forget the `isNull(deletedAt)` check in a new query, which would return deleted records.
- **Readability:** `withActive(table, conditions...)` clearly communicates intent — "filter to only active (non-deleted) records matching these conditions."
- **Type safety:** The generic constraint `T extends { deletedAt: SQLWrapper }` ensures the helper can only be used on tables that have a `deletedAt` column.

## `$onUpdateFn`: Automatic `updatedAt` Timestamps

Before the improvement, every `update()` repository method manually set `updatedAt`:

```typescript
// Before: manual in every update
.set({ ...data, updatedAt: new Date() })
```

Drizzle ORM's `$onUpdateFn` column modifier handles this automatically:

```typescript
// apps/api/src/db/schema/_columns.ts
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
};
```

### How it works

`$onUpdateFn` registers a callback that Drizzle calls automatically on every `.update()` operation. The returned value is included in the `SET` clause without the developer needing to specify it.

### Why not a database trigger?

- `$onUpdateFn` runs at the ORM level, not the database level. This keeps the logic visible in TypeScript code rather than hidden in a migration.
- Triggers add invisible behavior that's harder to debug and test.
- All updates go through Drizzle, so the ORM-level hook catches every case.

## Partial Indexes

Standard indexes include all rows — even soft-deleted ones that are never queried. We replaced all indexes with **partial indexes** that only include active records:

```sql
-- Before: indexes all rows including deleted ones
CREATE INDEX services_workspace_id_idx ON services (workspace_id);

-- After: indexes only active rows
CREATE INDEX services_workspace_id_active_idx ON services (workspace_id)
WHERE deleted_at IS NULL;
```

### In Drizzle ORM

```typescript
(table) => [
  index("services_workspace_id_active_idx")
    .on(table.workspaceId)
    .where(sql`${table.deletedAt} IS NULL`),
]
```

### Why partial indexes?

- **Smaller index size:** Deleted records are excluded, reducing disk usage and memory footprint.
- **Faster queries:** The index matches exactly the queries we run (which always filter `WHERE deleted_at IS NULL` via `withActive`).
- **PostgreSQL optimizer:** When a query's WHERE clause matches the index predicate, PostgreSQL can use the index directly without additional filtering.

### Partial unique indexes

For columns that must be unique among active records (email, workspace slug), we replaced standard `.unique()` constraints with partial unique indexes:

```typescript
// Before: prevents reuse of email even after soft delete
email: varchar("email", { length: 255 }).notNull().unique()

// After: allows soft-deleted users to "free" their email
uniqueIndex("users_email_active_idx")
  .on(table.email)
  .where(sql`${table.deletedAt} IS NULL`)
```

This means:
- Two active users cannot have the same email (enforced by the database)
- A soft-deleted user's email can be reused by a new registration
- The uniqueness constraint accurately reflects the business rule

## Select Projection: Excluding Sensitive Fields

The user repository was returning `passwordHash` in query results for methods that didn't need it. We fixed this with **select projection** using Drizzle's `getTableColumns()`:

```typescript
const { passwordHash: _passwordHash, deletedAt: _deletedAt, ...publicColumns } =
  getTableColumns(users);

export type UserPublic = Omit<User, "passwordHash" | "deletedAt">;
```

### Two query patterns

```typescript
// Public queries — never include passwordHash
async findById(id: number): Promise<UserPublic | null> {
  const [user] = await db.select(publicColumns).from(users)
    .where(withActive(users, eq(users.id, id)));
  return user ?? null;
}

// Auth-only query — includes all fields for password verification
async findByEmailWithPassword(email: string): Promise<User | null> {
  const [user] = await db.select().from(users)
    .where(withActive(users, eq(users.email, email)));
  return user ?? null;
}
```

### Why not just omit in the service layer?

- **Defense in depth:** The hash never leaves the database layer except through the explicitly named `findByEmailWithPassword` method.
- **Performance:** The database transfers less data when columns are excluded from the SELECT.
- **Type safety:** The return type `UserPublic` makes it impossible to accidentally access `passwordHash` in consumer code.

## Factory Functions: Repository Pattern

All repositories use factory functions that receive the database instance as a parameter:

```typescript
export function createServiceRepository(db: PostgresJsDatabase) {
  return {
    async create(data: NewService): Promise<Service> { ... },
    async findById(id: number, workspaceId: number): Promise<Service | null> { ... },
    // ...
  };
}

export type ServiceRepository = ReturnType<typeof createServiceRepository>;
```

### Why `ReturnType<typeof createXxxRepository>`?

- The type is **derived from the implementation**, not defined separately. Adding a new method to the return object automatically updates the type.
- No need to maintain a separate interface that could drift from the implementation.
- Services depend on the `ServiceRepository` type, making them testable with mock implementations.

## Migration: `0002_powerful_drax.sql`

The repository improvements required a database migration to:
1. Drop old standard indexes and unique constraints
2. Create new partial indexes (with `WHERE deleted_at IS NULL`)
3. Create partial unique indexes for email and slug

This was a single migration that applied all index changes atomically. The migration was generated via `drizzle-kit generate` from the updated schema files — no manual SQL was written.
