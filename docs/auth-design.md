# Auth Design

## JWT Storage: HttpOnly Cookie vs localStorage

We store JWT tokens in **HttpOnly cookies** instead of localStorage.

### Why not localStorage?

- localStorage is accessible via JavaScript. Any XSS vulnerability would allow an attacker to steal the token directly.
- The frontend would need to manually attach `Authorization: Bearer ...` header to every request.
- Token lifecycle management (clearing on logout, checking expiry) becomes the frontend's responsibility — more code, more room for bugs.

### Why HttpOnly cookie?

- JavaScript cannot access HttpOnly cookies, so even if an XSS vulnerability exists, the token cannot be stolen.
- The browser sends the cookie automatically with every request — the frontend only needs `withCredentials: true`.
- Token management stays entirely on the backend. Refreshing or rotating tokens requires zero frontend changes.

### CSRF trade-off

Cookies introduce a CSRF risk: since the browser attaches cookies automatically, a malicious site could trigger requests on behalf of the user.

We mitigate this with `sameSite: 'lax'`:

- Blocks cross-origin POST/PUT/DELETE requests (the dangerous ones)
- Allows same-site navigational GET requests (safe, expected behavior)
- Combined with the fact that our state-changing endpoints use POST/PUT/DELETE, `lax` provides strong CSRF protection without requiring a separate CSRF token mechanism

```typescript
reply.setCookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});
```

## Password Hashing: Argon2

We use **Argon2** (via the `argon2` npm package) for password hashing.

### Why not bcrypt or scrypt?

- **bcrypt** (1999) is still secure but only CPU-hard. GPU-based brute-force attacks can parallelize it relatively cheaply.
- **scrypt** (2009) introduced memory-hardness but has a complex configuration surface.
- **Argon2** (2015) won the Password Hashing Competition. It is both CPU-hard and **memory-hard**, meaning brute-force attacks require large amounts of RAM per attempt — making GPU/ASIC attacks significantly more expensive.

### Why Argon2 specifically?

- OWASP recommends Argon2id as the first choice for password hashing (https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- Simple API — no need to tune complex parameters for a secure default
- Built-in resistance to both side-channel and GPU-based attacks (Argon2id variant)

## JWT Payload: Minimal by Design

The JWT payload contains only two fields:

```typescript
interface JwtPayload {
  sub: number; // User ID
  email: string; // Login identity
}
```

### Why keep it minimal?

- **Token size:** The JWT is sent with every HTTP request via cookie. Adding fields like `fullName`, `avatarUrl`, or `role` increases the size of every request.
- **Stale data:** JWT content is frozen at sign time. If a user updates their name, the token still carries the old value until it expires. Mutable data should be fetched from the database at runtime, not embedded in the token.
- **Single responsibility:** The token's job is to **identify** the user, not to **describe** them. `sub` (user ID) is the only truly required field. `email` is included as a practical convenience for logging and identity context.

Any additional user information (profile, permissions, workspace memberships) is retrieved via endpoints like `GET /auth/me` at runtime, ensuring the response always reflects the current state.

## Auth Flow

### Endpoints

| Endpoint              | Auth      | Description                                 |
| --------------------- | --------- | ------------------------------------------- |
| `POST /auth/register` | Public    | Create account, set cookie, return user     |
| `POST /auth/login`    | Public    | Verify credentials, set cookie, return user |
| `POST /auth/logout`   | Protected | Clear cookie                                |
| `GET /auth/me`        | Protected | Return current user from DB                 |

### Register / Login

1. Frontend sends credentials to `/auth/register` or `/auth/login`
2. Backend validates input (TypeBox schema), hashes password (register) or verifies it (login)
3. Backend signs a JWT with `{ sub: userId, email }` and sets it as an HttpOnly cookie in the response
4. Backend returns `{ success: true, data: user }` — the user object, **not** the token
5. Frontend receives the user data and redirects to `/dashboard`
6. All subsequent requests automatically include the cookie — no frontend token handling needed

### Logout

1. Frontend sends `POST /auth/logout` (protected — requires valid cookie)
2. Backend clears the cookie with the same options used to set it (path, sameSite, etc.)
3. Frontend redirects to `/auth/login`

### Accessing Current User

`GET /auth/me` is the only way to get up-to-date user information. The frontend calls this on app initialization to check if the user is still authenticated and to load fresh profile data. This avoids relying on stale JWT payload data.

### Protected Routes

Routes that require authentication use Fastify's `preHandler` hook:

```typescript
fastify.get("/me", { preHandler: [fastify.authenticate] }, async (request) => {
  // request.user is available here with { sub, email }
});
```

The `authenticate` plugin calls `request.jwtVerify()`, which reads the cookie, verifies the signature, and populates `request.user` with the decoded JWT payload. If verification fails, it throws and the global error handler returns a 401.
