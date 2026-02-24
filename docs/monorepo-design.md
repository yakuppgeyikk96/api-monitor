# Monorepo Design

## Shared Types: `@repo/shared-types`

Frontend and backend share TypeScript types through a **shared package** (`packages/shared-types/`). Types are written once and both `@repo/api` and `@repo/web` import from the same source.

### Why?

- **Single source of truth:** One definition per type. When a type changes, TypeScript reports errors on both sides immediately — inconsistencies are caught at compile time.
- **Zero overhead:** No extra build step or tooling. pnpm resolves the workspace dependency locally, so imports just work.
- **Simplicity:** Both apps import what they need directly. No intermediate transformation or generation step.

### What lives in shared-types?

| Export | Purpose |
|--------|---------|
| `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError` | API response wrapper types |
| `ErrorCode`, `ErrorMessage` | Error code constants and their human-readable messages |
| `AuthUser`, `RegisterInput`, `LoginInput` | Auth-related entity and input types |
| `Workspace`, `CreateWorkspaceInput` | Workspace entity and input types |

### What does NOT belong in shared-types?

- Backend-only types (Drizzle schema inferences, repository interfaces)
- Frontend-only types (form state, UI-specific models)
- Types used by only one side — keep them local to that app
