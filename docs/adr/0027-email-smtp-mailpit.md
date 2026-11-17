# ADR-0027: Outbound email through SMTP (nodemailer), with Mailpit locally

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, tooling, ops
- **Supersedes:** —

## Context and problem statement

CU-02 sends a recovery code by email, and CU-18 tells the professional about renewals,
declined charges and suspensions. The system had no email channel. Everything has to work
locally without an email provider account, and a developer must be able to read the emails.

## Decision drivers

- Provider-independent: any SMTP server works (Mailgun, SES, Gmail, the company's server).
- Local emails must be visible, not only logged.
- Email content belongs to each module; delivery is shared.

## Considered options

1. SMTP with `nodemailer` + Mailpit (local SMTP server with a web inbox) in Compose.
2. An email API SDK (SendGrid, Resend).
3. Logging the emails instead of sending them.

## Decision outcome

Chosen option: **1. SMTP with nodemailer, Mailpit locally.**

- `#infrastructure/mail/MailTransport` (abstract: `send({ to, subject, text })`) and
  `SmtpMailTransport` (nodemailer). `SMTP_URL` and `MAIL_FROM` configure it.
- Module adapters write the message and implement their own Model port:
  `EmailPasswordRecoveryNotifier` (auth, CU-02) and `EmailBillingNotifier` (subscriptions,
  CU-18). The Model never sees email.
- Compose runs `axllent/mailpit` (SMTP `1025`, inbox `http://localhost:8025`); the API uses
  `smtp://mailpit:1025`. For `pnpm dev`: `docker compose up -d mongo mailpit`.
- Emails are sent outside transactions (ADR-0025). A failed email is logged and never undoes
  the use case (for CU-02 the answer stays the same, so accounts cannot be discovered).
- Tests inject `CapturingMailTransport` and read the codes from it.

### Consequences

- 👍 Production only changes `SMTP_URL`.
- 👍 Recovery codes and billing notices can be read locally at `http://localhost:8025`.
- 👎 No delivery tracking (bounces, opens). It would need a provider API behind the same
  `MailTransport`.
- 👎 Plain-text emails only.

## Enforcement

- Biome keeps `nodemailer` out of the Model (only infrastructure imports third parties).
- `apps/api/test/integration/account.http.test.ts` and `subscriptions.http.test.ts` assert the
  emails sent.

## References

- `apps/api/src/infrastructure/mail/`, <https://mailpit.axllent.org/>
