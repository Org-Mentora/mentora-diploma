# ADR-0018: Authentication with a JWT in an httpOnly cookie

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** backend, frontend, security
- **Supersedes:** —

## Context and problem statement

CU-01 (log in) and CU-03 (register) need sessions for professionals. CU-01 step 7 also
requires blocking access when the free trial or subscription is no longer valid. The SPA is
served from the same origin as the API (nginx proxy, Vite proxy in development).

## Decision drivers

- Tokens must not be readable from JavaScript (XSS).
- No extra infrastructure, such as a session store or Redis, for the MVP.
- A subscription check on every protected request, without a database round trip.
- Password hashing without native dependencies.

## Considered options

1. JWT (HS256) in an httpOnly `SameSite=Lax` cookie
2. Bearer token kept in `localStorage`
3. Server-side sessions in MongoDB

## Decision outcome

Chosen option: **a stateless JWT in the httpOnly cookie `mentora_session`.**

- **Abstractions:** the Model only sees `PasswordHasher` and `TokenService`, both in
  `core/security` ([ADR-0007](0007-adapter-pattern.md)).
- **Adapters:**
  - `ScryptPasswordHasher` (Node's built-in `crypto.scrypt`, random salt, constant-time compare);
  - `JoseTokenService` (`jose`, HS256, issuer `mentora-api`, TTL `SESSION_TTL_SECONDS`).
- **Claims:** `sub` = professional id; `aex` = the moment access ends (end of the trial).
- **`AuthGuard`** (`infrastructure/http`) offers two middlewares:
  - `requireSession`: valid token, or 401 `UNAUTHORIZED`. Used by `/auth/me`.
  - `requireActiveSubscription`: also returns 403 `SUBSCRIPTION_INACTIVE` once `aex` has
    passed. Used by every business route.
- **Login with an expired trial** still succeeds and reports `subscription.status = expired`, so
  the SPA can send the professional to `/plan-expired` (CU-01 step 7 alternative).
- **Credential errors:** login answers 401 with the same message for an unknown email and a
  wrong password.
- **Password policy:** at least 8 characters, with letters and digits (`PasswordPolicy` in the
  Model). The frontend mirrors it in its form schema.
- **Cookie:** `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` when `NODE_ENV=production`.
- **Secret:** `JWT_SECRET` is mandatory in production; `AppConfig` refuses to boot with the
  development default.
- **SPA:** `fetchBaseQuery` uses `credentials: 'include'`. Logout calls `POST /auth/logout` and
  resets the RTK Query cache.

### Consequences

- 👍 No token in JavaScript reach; no session store.
- 👎 A token cannot be revoked before it expires (8 h by default). Acceptable for the MVP; add
  a deny-list or refresh tokens if needed.
- 👎 A subscription change only takes effect on the next login. Paid plans (CU-18) will need
  to re-issue the cookie.

## Enforcement

`test/integration/auth.http.test.ts` covers the cookie, 401, 403 and expired-trial behaviour.
`noProcessEnv` keeps secrets inside `AppConfig`.

## References

- `apps/api/src/infrastructure/security/*`, `apps/api/src/infrastructure/http/AuthGuard.ts`
