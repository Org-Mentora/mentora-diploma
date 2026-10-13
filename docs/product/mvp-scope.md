# MVP scope

The MVP implements the fundamental use cases of the specification ("Especificación de Casos de
Uso", 2026-05-02). It is not the whole product.

## Implemented

| CU | Name | Backend | Frontend |
| --- | --- | --- | --- |
| CU-01 | Log in (with the subscription check of step 7) | `POST /auth/login`, `GET /auth/me`, `AuthGuard` | `/login`, `/plan-expired` |
| CU-03 | Register professional + free trial | `POST /auth/register` | `/register` |
| CU-04 | Register patient | `POST /patients` | "New patient" dialog |
| CU-05 | Search patient | `GET /patients?q=` | `/patients` |
| CU-06 | Modify patient | `PUT /patients/{id}` | Profile → "Edit data" |
| CU-07 | Manage patient status (manual flow) | `PATCH /patients/{id}/status` | Profile → Discharge / Reactivate |
| CU-08 | Consult clinical record | `GET /patients/{id}/clinical-record[/consultations/{cid}]` | Profile → "Clinical record" tab |
| CU-09 | Register consultation | `POST /patients/{id}/clinical-record/consultations` | `/patients/:id/consultations/new` |
| CU-10 | Manage appointments and agenda | `GET/POST /appointments`, `GET/PUT /appointments/{id}`, `POST /appointments/{id}/cancel` | `/agenda` |
| CU-11 | Manage diagnosis (read-only DSM-5 catalog + history) | `GET /diagnoses`, `GET /patients/{id}/clinical-record/diagnoses` | Diagnosis picker, "Diagnoses" tab |
| CU-12 | Manage medication | Part of CU-09 | Medication rows in the consultation form |

## Deferred

| CU | Name | Why deferred | Extension point already in place |
| --- | --- | --- | --- |
| CU-02 | Recover password | Needs an email provider | `PasswordHasher`, `PasswordPolicy` |
| CU-07 | Automatic inactivation after 3 months | Needs a scheduler | `Patient.markInactive()` (origin `automatic`) |
| CU-13 | Generate prescription (PDF) | Needs logo upload and a PDF engine | Professional data in `SessionDto` |
| CU-14 | WhatsApp notifications | Needs a WhatsApp Business API account | `AppointmentNotifier` (currently `LoggingAppointmentNotifier`) |
| CU-15 | Virtual consultation (Google Meet) | Needs Google integration | `modality: virtual` on appointments and consultations |
| CU-16 | Manage professional data | Not essential for the first flows | `Professional` aggregate |
| CU-17 | Change password | Not essential for the first flows | `PasswordHasher`, `PasswordPolicy` |
| CU-18 | Subscription and payments | Needs a payment provider | `Subscription` value object, `SUBSCRIPTION_INACTIVE` guard |

Diagram entities without use cases in the MVP: `Institucion`, `Consultorio`, `Pagos`,
`Liquidacion`, `ObraSocial` (as an entity) and `ContactoFamiliar` history.
