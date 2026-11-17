# ADR-0041: Pluggable token signing algorithm

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, security
- **Supersedes:** —

## Context and problem statement

[ADR-0018](0018-authentication-session-cookie.md) signs session JWTs with HS256. `JoseTokenService`
hard-coded both the algorithm name and the way the key was built from `JWT_SECRET`. Moving to an
asymmetric algorithm meant rewriting the adapter. EdDSA or RS256 would let other services verify
tokens without holding the signing secret, and an auditor could also ask for a different algorithm.

## Decision drivers

- Dependency inversion: the token adapter should depend on an abstraction, not on HS256.
- Changing the algorithm should touch one new class and one line of the composition root.
- Verification must accept only the configured algorithm, which prevents algorithm confusion.

## Considered options

1. Keep HS256 hard-coded and edit `JoseTokenService` when needed.
2. A `JWT_ALGORITHM` setting with a `switch` inside `JoseTokenService`.
3. A `TokenSigningAlgorithm` Strategy injected into `JoseTokenService`.

## Decision outcome

Chosen option: **3**. Option 2 keeps every algorithm inside one class, so adding an algorithm
still means editing that class.

- `TokenSigningAlgorithm` (`infrastructure/security`) exposes three things:
  - `name`: the JWS `alg` value;
  - `signingKey`;
  - `verificationKey`.

  Both keys are `node:crypto` `KeyObject`s.
- `HmacSha256SigningAlgorithm(secret)` is the only production implementation. Tokens stay
  exactly as they were.
- `JoseTokenService(algorithm, ttlSeconds)` signs with `algorithm.signingKey`. It verifies with
  `algorithm.verificationKey` and passes `algorithms: [algorithm.name]`.
- `createModules` in `src/app/modules.ts` chooses the algorithm.

Adding another algorithm means three steps:
1. Write a new `TokenSigningAlgorithm`, for example Ed25519 keys loaded from PEM settings in `AppConfig`.
2. Construct it in `createModules`.
3. Accept that every open session ends once, because existing tokens no longer verify.

### Consequences

- 👍 Switching algorithms leaves `JoseTokenService`, `AuthGuard` and the auth model unchanged.
- 👍 A token signed with any other algorithm is rejected, even when the key material matches.
- 👎 One more small class. Key rotation (several verification keys at once) is still not supported.

## Enforcement

- `apps/api/test/unit/auth-model.test.ts` swaps in a test-only Ed25519 strategy. It proves that the
  adapter issues and verifies EdDSA tokens and rejects an HS256 token.
- Review: `JoseTokenService` must not name an algorithm.

## References

- [ADR-0018](0018-authentication-session-cookie.md), [ADR-0007](0007-adapter-pattern.md)
- `apps/api/src/infrastructure/security/TokenSigningAlgorithm.ts`
- `apps/api/src/infrastructure/security/HmacSha256SigningAlgorithm.ts`
- `apps/api/src/infrastructure/security/JoseTokenService.ts`
