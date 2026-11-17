# ADR-0034: Session tokens carry a credentials version

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, security
- **Supersedes:** —

## Context and problem statement

ADR-0018 keeps sessions stateless: a signed JWT in an httpOnly cookie, valid for
`SESSION_TTL_SECONDS`. ADR-0029 made `GET /auth/me` re-issue the token, so a renewal or payment
reaches the guard without logging out.

Together they left a hole found in review: after a password change (CU-17) or reset (CU-02),
a stolen cookie kept working, and calling `/auth/me` before it expired renewed it forever.

## Decision drivers

- A password change or reset must end every other session.
- The current session (the one that changed the password) stays logged in.
- Keep the guard stateless and cheap (no extra query per request).

## Considered options

1. A credentials version claim, checked whenever the token is renewed.
2. A server-side session store (or deny list) checked on every request.
3. Shorter tokens with a refresh token.

## Decision outcome

Chosen option: **1. Credentials version claim.**

- `Professional.credentialsVersion` is the time of the last password change (`0` if never).
- `TokenService` writes it as the `cv` claim; `AuthGuard` puts it in the actor.
- `AuthService.getSession` rejects the session (401) when the token's version differs from the
  stored one, so `/auth/me` never renews a token issued before a password change.
- `PUT /auth/password` now answers `200 SessionDto` and re-issues the cookie with the new version.
- Tokens issued before this ADR have no `cv` and count as version `0`.

### Consequences

- 👍 A password change or reset stops other sessions from renewing; a stolen cookie dies, at the
  latest, when its TTL ends.
- 👍 No per-request database read; the guard stays stateless.
- 👎 Until the TTL ends, a stolen token still works for requests that do not renew it. If that
  window is too long, option 2 (new ADR) closes it.

## Enforcement

- `apps/api/test/integration/account.http.test.ts`: after a password change, another device gets
  401 on `/auth/me` and the current one keeps working.
- `apps/api/test/unit/auth-model.test.ts`: the claim round-trips through `JoseTokenService`.

## References

- ADR-0018, ADR-0028, ADR-0029
