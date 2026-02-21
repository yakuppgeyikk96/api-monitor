# API Monitor

A multi-tenant API monitoring platform that periodically checks registered endpoints and notifies users when responses don't match expected results.

## Architecture

Turborepo monorepo with pnpm workspaces.

| App/Service | Tech | Port | Path |
|-------------|------|------|------|
| **API** | Fastify 5 + TypeScript | 3001 | `apps/api/` |
| **Web** | Angular 21 | 4200 | `apps/web/` |
| **Database** | PostgreSQL 17 | 5434 (host) | Docker |
| **Checker** | Go (planned) | — | — |

- **API** handles CRUD operations, auth, and workspace management
- **Checker** (future Go service) will poll endpoints at fixed intervals and report results back via a message queue
- **Web** is the user-facing dashboard

## Tech Stack

- **Runtime**: Node.js 24
- **Package manager**: pnpm 9
- **ORM**: Drizzle ORM with drizzle-kit
- **Containerization**: Docker Compose for local development
- **Build orchestration**: Turborepo

## Database Conventions

- ORM: Drizzle ORM — schemas live in `apps/api/src/db/schema/`
- Migrations: `apps/api/drizzle/`
- IDs: `integer().primaryKey().generatedAlwaysAsIdentity()` (NOT serial)
- Timestamps: import shared `timestamps` from `_columns.ts`
- Table names: snake_case, plural (e.g. `users`, `workspaces`)
- Column names: snake_case in DB, camelCase in TypeScript
- Schema file names: singular (e.g. `user.ts` for `users` table)
- Multi-tenant: all user-facing tables must have a `workspace_id` foreign key
- Index all foreign key columns
- Use `varchar` with explicit length limits, not `text`
- Export `$inferInsert` and `$inferSelect` types from every schema file

## API Response Format

All API endpoints must return a consistent JSON structure:

```jsonc
// Success (single resource)
{ "success": true, "data": { ... } }

// Success (list with pagination)
{ "success": true, "data": [ ... ], "meta": { "total": 100, "page": 1, "limit": 20 } }

// Error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "User not found" } }
```

- Every response includes `success: boolean` at the top level
- Success responses wrap the payload in `data`
- List responses include a `meta` object with pagination info
- Error responses include `error.code` (UPPER_SNAKE_CASE) and `error.message`
- Never return raw data without the wrapper

## Angular Conventions

- **Angular 21** — standalone components by default, zoneless, Vite-based build
- **Project structure**: Feature-based — `core/`, `shared/`, `features/`
- **File naming**: No suffixes — `dashboard.ts` not `dashboard.component.ts`, `auth-api.ts` not `auth.service.ts`
- **Components**: Standalone (default), use `inject()` for DI, `signal()` for state
- **Template control flow**: `@if`, `@for`, `@switch` — NOT `*ngIf`/`*ngFor`
- **Routing**: Lazy loading with `loadComponent` / `loadChildren`
- **State management**: Signal-based services (no NgRx)
- **HTTP**: Functional interceptors, `withCredentials: true` for cookie auth
- **Auth**: HttpOnly cookie — no token in localStorage, functional guard + interceptor
- **Styling**: Tailwind CSS 4 + SCSS
- **Testing**: Vitest
- **RxJS vs Signals**: RxJS for streams/orchestration, Signals for state/display

### Frontend Structure

```
apps/web/src/app/
├── core/           → Singleton services, auth, layout, interceptors
├── shared/         → Reusable components, directives, pipes
├── features/       → Feature modules (lazy-loaded)
│   ├── auth/       → Login, register
│   ├── dashboard/
│   ├── services/
│   ├── endpoints/
│   └── settings/
└── environments/   → Environment configs
```

## Common Commands

```bash
# Development
pnpm dev                # Start all apps via Turborepo
pnpm build              # Build all apps
pnpm lint               # Lint all apps
pnpm check-types        # Type-check all apps

# Docker
docker compose up -d    # Start all services
docker compose down     # Stop all services
docker compose up -d --build  # Rebuild and start

# Database (run from project root)
pnpm --filter @repo/api drizzle-kit generate   # Generate migrations
pnpm --filter @repo/api drizzle-kit migrate    # Apply migrations
pnpm --filter @repo/api drizzle-kit push       # Push schema (dev only)
pnpm --filter @repo/api drizzle-kit studio     # Visual DB browser
```

## Project Structure

```
apps/
  api/          → Fastify backend (@repo/api)
  web/          → Angular frontend (@repo/web)
packages/
  shared-types/ → Shared TypeScript types (@repo/shared-types) — response wrappers, error codes, entity types
  eslint-config/→ Shared ESLint config
  typescript-config/ → Shared TS config
```

## Shared Types Strategy

Frontend–backend type consistency is maintained via `@repo/shared-types` package:
- API response wrapper types (`ApiResponse`, `PaginatedResponse`, `ApiError`)
- Error code enums/constants
- Shared entity types where both sides need the same shape
- Both `@repo/api` and `@repo/web` depend on this package

## Communication Language

The developer prefers Turkish for conversation. Keep responses incremental — avoid asking too many questions at once.