# Product scope

Mentora implements **every use case** of the specification ("Especificación de Casos de Uso",
2026-05-02). External services (email, WhatsApp, video calls, payments) run with local adapters
by default, so the whole product works on a laptop. Each one switches to the real provider by
configuration (see [External services](#external-services)).

## Use cases

| CU | Name | Backend | Frontend |
| --- | --- | --- | --- |
| CU-01 | Log in (subscription check of step 7 → plan page) | `POST /auth/login`, `GET /auth/me`, `AuthGuard` | `/login` |
| CU-02 | Recover password | `POST /auth/password-recovery[/verify\|/reset]` | `/forgot-password` |
| CU-03 | Register professional + free trial (+ optional offices and logo) | `POST /auth/register` | `/register` |
| CU-04 | Register patient | `POST /patients` | "New patient" dialog |
| CU-05 | Search patient | `GET /patients?q=` | `/patients` |
| CU-06 | Modify patient | `PUT /patients/{id}` | Profile → "Edit data" |
| CU-07 | Manage patient status: manual + **automatic after 3 months** | `PATCH /patients/{id}/status`, job `patients.inactivate-dormant` | Profile → Discharge / Reactivate |
| CU-08 | Consult clinical record | `GET /patients/{id}/clinical-record[/consultations/{cid}]` | Profile → "Clinical record" |
| CU-09 | Register consultation | `POST /patients/{id}/clinical-record/consultations` | `/patients/:id/consultations/new` |
| CU-10 | Manage appointments and agenda | `GET/POST /appointments`, `GET/PUT /appointments/{id}`, `POST /appointments/{id}/cancel` | `/agenda` |
| CU-11 | Manage diagnosis (read-only DSM-5 catalog + history) | `GET /diagnoses`, `GET /patients/{id}/clinical-record/diagnoses` | Diagnosis picker, "Diagnoses" tab |
| CU-12 | Manage medication | Part of CU-09 | Medication rows in the consultation form |
| CU-13 | Generate prescription (print / PDF) | `GET /auth/logo` (letterhead data) | `/patients/:id/prescriptions/new` |
| CU-14 | WhatsApp notifications (confirm, reschedule, cancel, reminder, video link) | `GET /notifications?patientId=`, job `appointments.send-reminders` | Profile → "Messages" |
| CU-15 | Virtual consultation | `POST/GET /virtual-meetings` | "Start virtual consultation" (profile, virtual appointment), "Virtual consultations" tab |
| CU-16 | Manage professional data (+ logo) | `PUT /auth/profile`, `PUT/DELETE /auth/logo` | `/settings/profile` |
| CU-17 | Change password | `PUT /auth/password` | `/settings/password` |
| CU-18 | Subscription and payments | `/subscription/*`, job `subscriptions.process-renewals` | `/settings/plan` |

## External services

| Need | Local default | Production option | Switch | ADR |
| --- | --- | --- | --- | --- |
| Email (CU-02, CU-18) | Mailpit, inbox at <http://localhost:8025> | Any SMTP server | `SMTP_URL`, `MAIL_FROM` | [0027](../adr/0027-email-smtp-mailpit.md) |
| WhatsApp (CU-14, CU-15) | Local outbox: API log + "Messages" tab | WhatsApp Business Cloud API | `WHATSAPP_PROVIDER=cloud-api` + token | [0030](../adr/0030-whatsapp-notifications.md) |
| Video calls (CU-15) | Jitsi Meet (no account) | Google Meet | `MEETING_PROVIDER=google-meet` + OAuth | [0031](../adr/0031-video-call-providers.md) |
| Payments (CU-18) | Simulated gateway with test cards | New `PaymentGateway` adapter (e.g. Mercado Pago) | Code: one adapter | [0029](../adr/0029-subscriptions-and-payments.md) |

The guide [Try every use case locally](../guides/try-locally.md) walks through all of them.

## Known limits

- Prescriptions are generated but not stored ([ADR-0032](../adr/0032-logo-storage-and-client-pdf.md)).
- Production WhatsApp needs approved message templates
  ([ADR-0030](../adr/0030-whatsapp-notifications.md)).
- A real payment provider must tokenize cards in the browser
  ([ADR-0029](../adr/0029-subscriptions-and-payments.md)).
- Rate limits are kept in memory per API instance ([ADR-0037](../adr/0037-operational-readiness.md)).
- Manual payments (CU-18) are accepted only when the access ends within 7 days, with a date in the
  last 30 days and a reference that was not used before.
- The CU-15 invitation is sent by WhatsApp only; there is no email fallback.
- One MongoDB node: up to 24 h of data can be lost in a disaster
  ([ADR-0039](../adr/0039-database-backup-strategy.md)).
- Two simultaneous bookings of the same slot can still both succeed
  ([ADR-0025](../adr/0025-transactions-with-context.md)).

Diagram entities without use cases: `Institucion`, `Consultorio` (offices are addresses on the
professional), `Liquidacion`, `ObraSocial` (as an entity) and `ContactoFamiliar` history.
