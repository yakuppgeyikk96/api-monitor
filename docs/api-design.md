# API Design

## Why Fastify?

We chose **Fastify 5** over Express and other Node.js frameworks.

### Performance

Fastify is significantly faster than Express in benchmarks. Its internal routing uses a radix tree (find-my-way) and serialization is optimized via `fast-json-stringify`. For an API monitoring platform that will handle frequent health-check traffic, this matters.

### Plugin System

The main architectural reason for choosing Fastify is its **plugin system** — a structured dependency injection mechanism that Express lacks entirely.

In Express, shared infrastructure (database, auth) is typically attached to `req` or `app` via untyped middleware. There is no dependency ordering, no lifecycle management, and no encapsulation.

Fastify plugins solve all of these:

- **`decorate`** — Adds typed properties to the Fastify instance. `fastify.db` and `fastify.authenticate` are fully typed and discoverable.
- **`dependencies`** — Plugins declare what they depend on. The auth plugin depends on JWT, JWT depends on cookie. Fastify resolves the order automatically, even if they are registered out of order.
- **Lifecycle hooks** — Plugins can hook into server events. The DB plugin uses `onClose` to cleanly shut down the database connection when the server stops.
- **Encapsulation** — Plugins are scoped by default. A plugin registered inside a route group doesn't leak into other routes unless explicitly shared via `fastify-plugin`.

```typescript
// db.ts — decorates fastify.db, cleans up on server close
async function dbPlugin(fastify: FastifyInstance) {
  const client = postgres(process.env.DATABASE_URL!);
  fastify.decorate("db", drizzle(client));
  fastify.addHook("onClose", async () => await client.end());
}
export default fp(dbPlugin, { name: "db" });

// auth.ts — depends on jwt, which depends on cookie
async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate("authenticate", async function (request, reply) {
    await request.jwtVerify();
  });
}
export default fp(authPlugin, { name: "auth", dependencies: ["jwt"] });

// index.ts — register order doesn't matter, Fastify resolves the graph
server.register(dbPlugin);
server.register(cookiePlugin);
server.register(jwtPlugin);
server.register(authPlugin);
```

### Native JSON Schema validation

Fastify validates requests and serializes responses using JSON Schema natively. This integrates directly with TypeBox (see [Request Validation](#request-validation-typebox) below) and enables automatic OpenAPI documentation generation.

## Layered Architecture: Routes → Service → Repository

Every API module follows a three-layer pattern:

```
Routes (HTTP) → Service (Business Logic) → Repository (Data Access)
```

### Why three layers?

- **Testability:** Each layer can be tested in isolation. Services can be tested with mock repositories, repositories can be tested against a test database, routes can be tested with mock services.
- **Swappable data layer:** If the database or ORM changes, only the repository layer needs to be updated. Business logic and HTTP handling remain untouched.
- **Separation of concerns:** Each layer has a single, clear responsibility:
  - **Routes** — HTTP concerns: request parsing, schema validation, status codes, cookie handling
  - **Service** — Business logic: authorization checks, validation rules, slug generation, orchestrating multiple repositories
  - **Repository** — Data access: SQL/ORM queries, filtering, inserts, updates

A route handler never contains SQL. A repository never returns HTTP status codes. A service never reads cookies.

### Factory functions over classes

Services and repositories are created via factory functions, not classes:

```typescript
// Repository — receives db as a parameter
export function createWorkspaceRepository(db: Database) {
  return {
    async create(data) { ... },
    async findBySlug(slug) { ... },
  };
}

// Service — receives repository as a parameter
export function createWorkspaceService(repository: WorkspaceRepository) {
  return {
    async create(ownerId, input) { ... },
  };
}

// Routes — wires everything together
export default async function workspaceRoutes(fastify: FastifyInstance) {
  const repository = createWorkspaceRepository(fastify.db);
  const service = createWorkspaceService(repository);
  // ...
}
```

**Why factory functions instead of classes?**

- Dependencies are explicit function parameters — easy to mock in tests
- No decorator magic or DI container needed
- Simpler and more transparent than class + `@Injectable()` patterns
- The returned object is a plain interface — easy to type and replace

## Request Validation: TypeBox

We use **TypeBox** for request validation instead of alternatives like Zod.

### Why TypeBox?

Fastify's built-in validation system is based on **JSON Schema**. TypeBox produces JSON Schema natively while providing full TypeScript type inference — it fits Fastify without any adapter layer.

```typescript
// TypeBox produces a JSON Schema object + infers the TS type
const RegisterBodySchema = Type.Object({
  email: Type.String({ format: "email", maxLength: 255 }),
  password: Type.String({ minLength: 8, maxLength: 128 }),
  fullName: Type.String({ minLength: 1, maxLength: 100 }),
});

// Fastify accepts it directly — validation happens automatically
fastify.post("/register", { schema: { body: RegisterBodySchema } }, handler);
```

### Why not Zod?

- Zod uses its own validation format, not JSON Schema
- Integrating Zod with Fastify requires a translation layer (e.g., `zod-to-json-schema`) or disabling Fastify's built-in validation entirely
- Bypassing Fastify's native validation means losing automatic serialization and documentation (Swagger/OpenAPI) benefits

TypeBox fits Fastify with zero friction. Zod would add an unnecessary conversion step between two incompatible schema systems.

## Response Format: Consistent Wrapper

All API endpoints return a consistent JSON structure. This provides a predictable contract for the frontend and keeps response handling uniform across the entire application.

### Success (single resource)

```json
{
  "success": true,
  "data": { "id": 1, "name": "My Workspace" }
}
```

### Success (paginated list)

```json
{
  "success": true,
  "data": [{ "id": 1 }, { "id": 2 }],
  "meta": { "total": 100, "page": 1, "limit": 20 }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "WORKSPACE_NOT_FOUND",
    "message": "Workspace not found"
  }
}
```

### Why wrap every response?

- **Frontend simplicity:** A single `if (res.success)` check works for every endpoint — no need for different handling strategies per route.
- **Programmatic error handling:** `error.code` (UPPER_SNAKE_CASE) allows the frontend to react to specific error types (e.g., show "this email is already in use" when `code === "EMAIL_TAKEN"`), while `error.message` provides a human-readable fallback.
- **Generic pagination:** The `meta` object follows the same shape for every list endpoint, so a single reusable pagination component can consume any paginated response.
- **No ambiguity:** Raw data responses leave room for confusion — is an empty object an error or a valid result? The `success` flag removes all guessing.
