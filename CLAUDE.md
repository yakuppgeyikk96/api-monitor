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
packages/       → Shared configs (eslint, typescript)
```

## Communication Language

The developer prefers Turkish for conversation. Keep responses incremental — avoid asking too many questions at once.