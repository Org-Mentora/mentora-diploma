# Try every use case locally

Everything runs on your machine; no external account is needed.

```bash
cp .env.example .env
docker compose up -d mongo mailpit   # MongoDB replica set + email inbox
pnpm dev                              # web http://localhost:5173 · api http://localhost:3000
```

Or the full stack in containers: `docker compose up --build` (web on <http://localhost:8080>).

| Where to look | What you see |
| --- | --- |
| <http://localhost:8025> | Mailpit: recovery codes (CU-02) and billing emails (CU-18) |
| API log, `WhatsApp message (local outbox)` | WhatsApp messages (CU-14, CU-15) |
| Patient profile → "Messages" | The same messages with their delivery result |
| <http://localhost:3000/api/docs> | Swagger UI with every endpoint |

## Walkthrough

1. **CU-03** Register at `/register` (optionally with offices and a PNG/JPEG logo). The trial
   starts (14 days).
2. **CU-04/05/06** Create patients; give one a phone number such as `11 5555 1234`.
3. **CU-10 + CU-14** Schedule an appointment for that patient. "Messages" shows the
   confirmation; rescheduling and cancelling send messages too. The reminder goes out 24 hours
   before, through the `appointments.send-reminders` job (every 10 minutes).
4. **CU-15** Schedule a *virtual* appointment and open it in the agenda. "Start virtual
   consultation" creates a Jitsi link, sends it by WhatsApp and opens it. The same button
   exists in the patient header. The history is in "Virtual consultations".
5. **CU-09/11/12** Register a consultation with a DSM-5 diagnosis and medications.
6. **CU-13** "New prescription" in the patient header: write, then *Print* or *Download PDF*.
7. **CU-16/17** `/settings/profile` and `/settings/password`.
8. **CU-02** Log out, "Forgot your password?", read the code in Mailpit.
9. **CU-18** `/settings/plan`. Test cards of the simulated gateway (any future expiry, any CVC):

   | Card | Result |
   | --- | --- |
   | `4242 4242 4242 4242` | Approved |
   | `5555 5555 5555 4444` | Approved (Mastercard) |
   | `4000 0000 0000 0002` | Declined: card declined |
   | `4000 0000 0000 9995` | Declined: insufficient funds |
   | `4000 0000 0000 0119` | Technical error (3 in a row → suspended) |

10. **CU-01 step 7** To see an expired trial, start the API with `TRIAL_DAYS=0` and register a
    new professional. Login sends you to the plan page, and the rest of the app is locked
    until you pay.

## Background jobs (ADR-0026)

| Job | Every | Does |
| --- | --- | --- |
| `appointments.send-reminders` | 10 min | WhatsApp reminder for appointments in the next 24 h |
| `patients.inactivate-dormant` | 6 h | CU-07: active patients without consultations for 3 months → inactive |
| `subscriptions.process-renewals` | 1 h | CU-18: charges renewals, expires trials, suspends after failures |

They start 5 seconds after the API. Disable them with `SCHEDULER_ENABLED=false`.

## Health, backups and the production stack

| Try | How |
| --- | --- |
| Liveness / readiness | `curl localhost:3000/api/health/live` and `/api/health/ready` (503 while MongoDB is down) |
| Request id | Every response has `X-Request-Id`; search the API log for it |
| Rate limit | 11 wrong logins with the same email in 15 min → 429 with `Retry-After` |
| Backup / restore the dev database | `pnpm db:backup`, then `pnpm db:restore backups/<file>` |
| Production stack and smoke test | [ci-cd.md → E2E locally](../operations/ci-cd.md#reproduce-a-failing-check-locally) |
