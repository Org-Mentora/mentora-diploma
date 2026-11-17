# ADR-0028: Password recovery with short-lived, hashed, single-use codes

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, security
- **Supersedes:** —

## Context and problem statement

CU-02 lets a professional who forgot the password set a new one with a code sent by email.
The flow is: request the code, enter it, and only then choose the new password. The
specification also says the system must answer the same way when the email does not exist.

## Decision drivers

- Do not reveal which emails have an account (CU-02 step 4 alternative).
- A stolen database must not reveal valid codes.
- Six digits are easy to type but can be guessed, so attempts must be limited.

## Considered options

1. Six-digit numeric code, hashed, 15 minutes, 5 attempts, single use.
2. A long random link token (magic link).
3. Security questions.

## Decision outcome

Chosen option: **1. Six-digit code with strict limits.** It matches the specification
("código de recuperación", typed by the professional).

- `CryptoRecoveryCodeGenerator` uses `crypto.randomInt` (CSPRNG). The code is hashed with the
  same `PasswordHasher` as passwords (scrypt); only the hash is stored.
- `PasswordRecovery` (auth Model) lasts 15 minutes and allows 5 wrong attempts. It is
  invalidated when it is used, and also when a new code is requested.
- `POST /auth/password-recovery` always answers `202` with the same message. The email goes
  out after the transaction, and a delivery failure is only logged.
- `POST /auth/password-recovery/verify` checks the code (step 8) without using it, and
  `POST /auth/password-recovery/reset` changes the password and invalidates the code in one
  transaction (ADR-0025).
- A wrong code, an expired code, a used code and an unknown email all answer
  `400 INVALID_RECOVERY_CODE` with the same message.
- The failed-attempt counter must survive the failed request. The check therefore returns
  `null` instead of throwing inside the transaction (a thrown error would roll the counter
  back), and the error is raised after the commit.
- A MongoDB TTL index deletes recovery documents one day after they expire.

### Consequences

- 👍 No account enumeration; brute force is limited to 5 tries per code.
- 👍 The same password policy (`PasswordPolicy`) applies to CU-02, CU-03 and CU-17.
- 👎 There is no rate limit per IP address or email for code requests yet. An attacker can
  make the system send many emails. Add one before going public.
- 👎 Sessions opened before the change stay valid until they expire (stateless JWT, ADR-0018).

## Enforcement

- `apps/api/test/integration/account.http.test.ts`: same answer for unknown emails, 5
  attempts, expiry, invalidation after use and after a new request.
- `apps/api/test/unit/auth-model.test.ts` (`PasswordRecovery`).

## References

- `apps/api/src/modules/auth/model/PasswordRecoveryService.ts`
