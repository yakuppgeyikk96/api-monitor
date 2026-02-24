# Services Module Design

## Overview

The services module is the first multi-tenant CRUD module after auth and workspaces. It established patterns that all subsequent modules (endpoints, check results) follow. This document captures the architectural decisions made during its implementation.

## API Design: Nested Routes

Services are accessed via workspace-scoped nested routes:

```
POST   /workspaces/:workspaceId/services
GET    /workspaces/:workspaceId/services
GET    /workspaces/:workspaceId/services/:id
PATCH  /workspaces/:workspaceId/services/:id
DELETE /workspaces/:workspaceId/services/:id
```

### Why nested under workspace?

- The `workspaceId` in the URL makes the tenant boundary explicit. Every request is scoped to a workspace without relying on implicit context (session state, default workspace).
- Authorization can be checked early: the service layer verifies workspace ownership before touching any service data.
- RESTful convention: a service is a sub-resource of a workspace. The URL structure reflects the data hierarchy.

### Frontend: flat route with workspace selector

While the API uses nested routes, the frontend uses a **flat route** (`/services`) with a workspace dropdown selector. This is intentional:

- Putting `workspaceId` in the browser URL (e.g., `/workspaces/3/services`) would require URL changes when switching workspaces, complicating navigation and browser history.
- A dropdown selector provides a smoother UX — the user selects a workspace and immediately sees its services without a page reload or URL change.
- The frontend passes `workspaceId` as an API parameter, not as part of its own route structure.

## Service Layer: Cross-Repository Dependencies

The services module introduced the pattern of a service depending on **multiple repositories**:

```typescript
interface ServiceServiceDeps {
  repository: ServiceRepository;
  workspaceRepository: WorkspaceRepository;
}

export function createServiceService({ repository, workspaceRepository }: ServiceServiceDeps) {
  // ...
}
```

### Why inject WorkspaceRepository?

Every service operation requires **workspace ownership verification** — the user must own the workspace before creating, reading, updating, or deleting services within it. This check queries the `workspaces` table, which belongs to the workspace repository.

Rather than duplicating ownership logic or creating a shared auth utility, the service receives the workspace repository as a dependency. This keeps the check explicit and testable.

### Pattern: assert helpers

Authorization and existence checks are extracted into private `assert*` functions within the service factory:

```typescript
async function assertWorkspaceOwner(workspaceId: number, userId: number) {
  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) throw new AppError(ErrorCode.WORKSPACE_NOT_FOUND, ...);
  if (workspace.ownerId !== userId) throw new AppError(ErrorCode.FORBIDDEN, ...);
  return workspace;
}

async function assertServiceExists(id: number, workspaceId: number) {
  const service = await repository.findById(id, workspaceId);
  if (!service) throw new AppError(ErrorCode.SERVICE_NOT_FOUND, ...);
  return service;
}
```

These assert helpers:
- Keep CRUD methods clean — each method calls `assertWorkspaceOwner()` and optionally `assertServiceExists()` before proceeding
- Return the found entity so the caller can use it (no duplicate query)
- Throw `AppError` with typed error codes from `@repo/shared-types`

## Cascade Soft Delete

When a service is deleted, all its child endpoints must also be soft-deleted. This happens in a **single database transaction** at the repository level.

```typescript
// service.repository.ts
async softDeleteCascade(id: number, workspaceId: number): Promise<void> {
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.update(endpoints).set({ deletedAt: now })
      .where(withActive(endpoints, eq(endpoints.serviceId, id)));
    await tx.update(services).set({ deletedAt: now })
      .where(withActive(services, eq(services.id, id), eq(services.workspaceId, workspaceId)));
  });
}
```

### Why transactions belong in the repository

An earlier implementation placed the `db.transaction()` call in the service layer. This was a mistake — it violated the three-layer architecture by requiring the service layer to import Drizzle operators and schema tables.

The corrected approach:
- **Repository** owns all database operations including transactions. `softDeleteCascade` encapsulates the multi-table update in a single atomic method.
- **Service** only calls `repository.softDeleteCascade(id, workspaceId)`. It has no knowledge of transactions, SQL, or which tables are involved.

This keeps the service layer free of ORM imports (see [API Layer Responsibilities in CLAUDE.md](../CLAUDE.md)).

### Why `softDeleteCascade` instead of `softDelete`

The method is named `softDeleteCascade` even when the entity has no children yet (e.g., future modules). This provides:
- **Pattern consistency** — every entity uses the same method name
- **Future safety** — when child entities are added (e.g., check results under endpoints), the method name already communicates the cascading intent

### Why `workspaceId` is included in the delete WHERE clause

The soft delete query includes `workspaceId` as a filter condition:

```typescript
.where(withActive(services, eq(services.id, id), eq(services.workspaceId, workspaceId)))
```

Even though the service layer already verifies ownership via `assertWorkspaceOwner()`, the repository still filters by `workspaceId`. This is **defense in depth**:
- If a bug in the service layer skips the ownership check, the repository won't accidentally delete a service from another workspace
- The database query itself enforces tenant isolation

## Shared Types

Service types live in `@repo/shared-types` so both frontend and backend use the same shape:

```typescript
// packages/shared-types/src/service.ts
export interface Service { /* all DB columns */ }
export interface CreateServiceInput { /* required + optional fields */ }
export interface UpdateServiceInput { /* all fields optional */ }
```

### Timestamp fields as `string`, not `Date`

In shared types, `createdAt`, `updatedAt`, and `deletedAt` are typed as `string` (or `string | null`), not `Date`. This is because:
- JSON serialization converts `Date` objects to ISO strings
- The frontend receives strings from the API, not Date objects
- Using `string` avoids confusion about when deserialization happens

## TypeBox Validation

Request validation uses TypeBox schemas that produce JSON Schema compatible with Fastify's native validation:

```typescript
// service.schema.ts
export const CreateServiceBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  baseUrl: Type.String({ minLength: 1, maxLength: 2048 }),
  defaultHeaders: Type.Optional(Type.Record(Type.String(), Type.String())),
  defaultTimeoutSeconds: Type.Optional(Type.Integer({ minimum: 1, maximum: 300 })),
});
```

### Update schema: nullable fields

The update schema uses `Type.Union([Type.Record(...), Type.Null()])` for `defaultHeaders` to allow **explicitly clearing** the field:

```typescript
defaultHeaders: Type.Optional(
  Type.Union([Type.Record(Type.String(), Type.String()), Type.Null()]),
)
```

- Omitting the field (`undefined`) means "don't change"
- Sending `null` means "clear the value"
- Sending a new object means "replace the value"

This three-state pattern (absent / null / value) is important for PATCH endpoints where each field is independently updateable.

## Error Handling

Services use typed error codes from `@repo/shared-types/errors`:

```typescript
throw new AppError(ErrorCode.SERVICE_NOT_FOUND, ErrorMessage.SERVICE_NOT_FOUND, 404);
```

Each entity has its own error code (e.g., `SERVICE_NOT_FOUND` vs `WORKSPACE_NOT_FOUND`) rather than a generic `NOT_FOUND`. This allows the frontend to react differently to each error type if needed.
