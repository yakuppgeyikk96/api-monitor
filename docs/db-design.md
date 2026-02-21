# Database Design

## Entity Relationships

```
users (1) ────< (N) workspaces
                      |
                      | workspace_id
                      |
                (1) --+--< (N) services
                      |          |
                      |          | service_id
                      |          |
                      +----< (N) endpoints
                       workspace_id (denormalized)
```

- `users` 1:N `workspaces` via `owner_id`
- `workspaces` 1:N `services` via `workspace_id`
- `services` 1:N `endpoints` via `service_id`
- `workspaces` 1:N `endpoints` via denormalized `workspace_id`

## Multi-Tenancy Model

Every user-facing table includes a `workspace_id` foreign key. The workspace is the tenant boundary for the entire platform. All data access is scoped to a workspace.

## Service Layer: Why Not Just Endpoints?

Instead of storing a full URL on each endpoint, we introduced a **service** entity that holds a `base_url` and shared configuration (default headers, timeout). Endpoints only store the `route` path.

**Rationale:**

- Users typically monitor multiple endpoints on the same API (e.g., `/health`, `/orders`, `/users`)
- Common settings like auth headers and timeouts are defined once at the service level
- Avoids data duplication — changing a base URL or API key updates all endpoints at once
- A workspace can monitor multiple services (e.g., "Payment API" + "Auth API"), not limited to a single base URL

## Denormalized `workspace_id` on Endpoints

The `endpoints` table has both `service_id` (logical parent) and `workspace_id` (tenant boundary). This is intentional denormalization.

**Rationale:**

- The checker service queries active endpoints at high frequency across all tenants
- Dashboard queries like "all endpoints in workspace X" are common
- Without denormalization, every such query requires a JOIN through `services`
- The consistency cost is low: `workspace_id` is set once at creation and never changes
- Application layer enforces that `endpoint.workspace_id == service.workspace_id`

## Soft Delete

All tables use a `deleted_at` timestamp column instead of hard deletes. This allows:

- Data recovery if a user accidentally deletes a workspace/service/endpoint
- Audit trail for compliance
- Graceful cleanup — a background job can hard-delete old soft-deleted records

**Important:** `ON DELETE CASCADE` on foreign keys only fires on hard row deletion, not on setting `deleted_at`. The application layer must propagate soft deletes to child records explicitly.

## varchar vs pgEnum

`plan` and `http_method` use `varchar` with length limits instead of PostgreSQL enums.

**Rationale:**

- Adding a new enum value requires `ALTER TYPE ... ADD VALUE` migration
- Removing or renaming enum values requires recreating the type entirely
- `varchar` with application-level validation is simpler to evolve
- Length limits (`varchar(20)` for plan, `varchar(10)` for method) still enforce bounds

## jsonb for Headers and Bodies

`default_headers`, `headers`, `body`, and `expected_body` use `jsonb` type.

**Rationale:**

- These fields have variable, unpredictable structure
- JSONB validates JSON on insert (unlike `text` with serialized JSON)
- Supports native PostgreSQL operators for querying and partial matching
- The checker service can merge service-level and endpoint-level headers using JSONB operations
- GIN indexes can be added later if querying by header keys becomes necessary

## Header Merge Strategy

At check time, the checker service merges headers from two levels:

1. `services.default_headers` — base headers (e.g., auth tokens)
2. `endpoints.headers` — endpoint-specific overrides

Endpoint headers take precedence on key conflicts. If `endpoints.headers` is NULL, only service defaults are used.

## Plan-Based Limits

Limits are stored directly on the workspace rather than derived from the plan name in application code.

**Rationale:**

- Allows per-workspace overrides for custom deals or grandfathered accounts
- `max_services` — controls how many services a workspace can create
- `max_check_interval_seconds` — the fastest allowed polling frequency (lower = more frequent = more expensive)
- Application layer enforces `endpoint.check_interval_seconds >= workspace.max_check_interval_seconds`

## Indexes

### Standard Indexes

- All foreign key columns are indexed (project convention)
- All `deleted_at` columns are indexed for soft-delete filtering

### Composite Index: `endpoints_active_check_idx`

- Columns: `(is_active, deleted_at)`
- Purpose: Optimizes the checker service's hottest query — "give me all active, non-deleted endpoints"
- This is the most performance-critical index in the system
