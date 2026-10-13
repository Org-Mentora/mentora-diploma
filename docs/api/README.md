# API reference

The API is documented with OpenAPI 3.1, generated from the zod contracts
([ADR-0009](../adr/0009-code-first-openapi.md)).

| What | Where |
| --- | --- |
| Swagger UI | <http://localhost:3000/api/docs> (or <http://localhost:8080/api/docs> through nginx) |
| OpenAPI JSON (live) | `GET /api/openapi.json` |
| OpenAPI JSON (committed) | [`packages/contracts/openapi.json`](../../packages/contracts/openapi.json) |
| Generated DTO types | [`packages/contracts/src/dtos.generated.ts`](../../packages/contracts/src/dtos.generated.ts) |

## Conventions

- Base path `/api`; resources in plural kebab-case (`/api/mentors`, `/api/mentoring-sessions`).
- `operationId` in camelCase verb + noun (`listMentors`, `getMentor`, `createMentor`).
  It names the generated hooks.
- DTO schema ids end in `Dto` (`MentorDto`, `CreateMentorRequestDto`).
- Dates are ISO-8601 strings; ids are UUID strings.

## Error format

Every error response uses `ErrorResponseDto`:

```json
{ "error": { "code": "NOT_FOUND", "message": "Mentor '42' was not found", "details": { } } }
```

| `kind` (Model) | HTTP | `code` |
| --- | --- | --- |
| validation | 400 | `VALIDATION_ERROR` (details = zod issues, or `{ field }` for business rules) |
| unauthorized | 401 | `UNAUTHORIZED` |
| forbidden | 403 | `FORBIDDEN`, `SUBSCRIPTION_INACTIVE` |
| not_found | 404 | `NOT_FOUND` / `ROUTE_NOT_FOUND` |
| conflict | 409 | `CONFLICT` |
| — | 500 | `INTERNAL_ERROR` |

## Endpoints

| Method | Path | operationId | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | `getHealth` | Service and dependency health |
| POST | `/api/auth/register` | `registerProfessional` | CU-03 register + free trial (sets cookie) |
| POST | `/api/auth/login` | `login` | CU-01 log in (sets cookie) |
| POST | `/api/auth/logout` | `logout` | Clear the session cookie |
| GET | `/api/auth/me` | `getCurrentProfessional` | Current session (🔒 session) |
| POST | `/api/patients` | `createPatient` | CU-04 (🔒) |
| GET | `/api/patients?q=` | `searchPatients` | CU-05 (🔒) |
| GET | `/api/patients/{id}` | `getPatient` | Profile (🔒) |
| PUT | `/api/patients/{id}` | `updatePatient` | CU-06 (🔒) |
| PATCH | `/api/patients/{id}/status` | `changePatientStatus` | CU-07 (🔒) |
| GET | `/api/diagnoses?q=&category=` | `searchDiagnoses` | CU-11 DSM-5 catalog (🔒) |
| GET | `/api/patients/{id}/clinical-record` | `getClinicalRecord` | CU-08 (🔒) |
| POST | `/api/patients/{id}/clinical-record/consultations` | `registerConsultation` | CU-09/11/12 (🔒) |
| GET | `/api/patients/{id}/clinical-record/consultations/{consultationId}` | `getConsultation` | CU-08 detail (🔒) |
| GET | `/api/patients/{id}/clinical-record/diagnoses` | `getDiagnosisHistory` | CU-11 history (🔒) |
| GET | `/api/appointments?from=&to=` | `listAppointments` | CU-10 agenda, max 62 days (🔒) |
| POST | `/api/appointments` | `scheduleAppointment` | CU-10 create; 409 on overlap (🔒) |
| GET | `/api/appointments/{id}` | `getAppointment` | CU-10 detail (🔒) |
| PUT | `/api/appointments/{id}` | `rescheduleAppointment` | CU-10 modify; 409 on overlap (🔒) |
| POST | `/api/appointments/{id}/cancel` | `cancelAppointment` | CU-10 cancel (🔒) |

🔒 = requires the `mentora_session` cookie and an active subscription or trial
([ADR-0018](../adr/0018-authentication-session-cookie.md)); `/auth/me` only needs the session.
Resources of another professional answer 404 ([ADR-0019](../adr/0019-per-professional-data-ownership.md)).
