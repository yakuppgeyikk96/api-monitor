# Multi-Tenancy Design

## Workspace as Tenant

The workspace is the **tenant boundary** for the entire platform. All user-facing data (services, endpoints, check results) belongs to a workspace, not directly to a user.

### Why workspace-level, not user-level?

The platform is designed for **team collaboration**. A user can create multiple workspaces and invite other users to them. If data were scoped to individual users, adding team support later would require migrating every table from `user_id` to a new grouping concept.

By making the workspace the tenant from day one, the data model is ready for teams. When team support is added, only a `workspace_members` table is needed — existing tables and queries remain unchanged.

### Current authorization model

Currently, each workspace has a single `owner_id`. All authorization checks verify:

```typescript
workspace.ownerId === request.user.sub
```

This is sufficient for the single-user phase.

### Planned evolution: role-based access

When team support is introduced, authorization will move to a `workspace_members` table with roles:

| Role | Description |
|------|-------------|
| **owner** | Full control, can delete workspace, manage members |
| **admin** | Can manage services, endpoints, and settings |
| **member** | Can create and edit services and endpoints |
| **viewer** | Read-only access |

The `ownerId` on the workspace will remain to identify the original creator, but authorization checks will be based on the member's role rather than ownership.

### Data scoping

Every user-facing table has a `workspace_id` foreign key. All repository queries filter by workspace, ensuring complete data isolation between tenants. See [db-design.md](./db-design.md) for details on indexing, denormalization, and soft delete strategies.
