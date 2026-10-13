# API reference

The API is documented with OpenAPI 3.0, generated from the zod contracts
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
| validation | 400 | `VALIDATION_ERROR` (details = zod issues) |
| unauthorized | 401 | `UNAUTHORIZED` |
| forbidden | 403 | `FORBIDDEN` |
| not_found | 404 | `NOT_FOUND` / `ROUTE_NOT_FOUND` |
| conflict | 409 | `CONFLICT` |
| — | 500 | `INTERNAL_ERROR` |

## Endpoints

| Method | Path | operationId | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | `getHealth` | Service and dependency health |
