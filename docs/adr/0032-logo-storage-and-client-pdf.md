# ADR-0032: Logo stored in MongoDB; prescriptions printed and rendered to PDF in the browser

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, frontend, tooling
- **Supersedes:** —

## Context and problem statement

CU-13 generates a free-text prescription with an automatic letterhead (professional data and
logo, or a default logo), which can be printed or downloaded as PDF. CU-16 (and CU-03,
optionally) uploads the logo. The specification does not require keeping the prescriptions,
and an editor closed without printing must not generate anything.

## Decision drivers

- No file storage service locally.
- No new transport for binary uploads: the API speaks JSON and the SPA uses generated hooks
  (ADR-0010).
- Keep the PDF engine out of the initial bundle.

## Considered options

1. Logo as a small binary in its own MongoDB collection, sent as a `data:` URL in JSON; PDF
   rendered in the browser with jsPDF; printing with the browser and print CSS.
2. Object storage (S3/MinIO) for the logo; PDF rendered in the API (pdfkit/Puppeteer).
3. Logo inside the professional document.

## Decision outcome

Chosen option: **1. Logo in MongoDB, PDF in the browser.**

- **Logo.** `PUT /auth/logo { dataUrl }` accepts PNG or JPEG up to 512 KB. `ProfessionalLogo`
  checks the declared type and the file signature, so a renamed file is rejected. It is
  stored as binary in `professional_logos` (one document per professional), never inside
  the professional, so sessions do not load it. `GET /auth/logo` returns `{ dataUrl | null }`.
  Only PNG and JPEG are accepted because jsPDF embeds those directly.
- **Prescription.** `features/prescriptions` shows the sheet with the letterhead and an editor.
  - `PrescriptionBuilder` (model/domain) builds the document.
  - *Print* calls `window.print()`; print CSS (`print:` variants) keeps only the sheet.
  - *Download PDF* loads `PrescriptionPdfAdapter` on demand (`import()`). It renders an A4
    with jsPDF, draws a default logo (initials) when there is none, and starts the download.
- Nothing is persisted: leaving the page discards the prescription (step 6 alternative).

### Consequences

- 👍 No storage service and no binary endpoints; everything goes through generated hooks.
- 👍 jsPDF (~350 KB) is only downloaded when a PDF is requested.
- 👎 Prescriptions are not kept in the clinical record. If that becomes a requirement, the
  same `PrescriptionDocument` can be stored and the PDF rendered on the server.
- 👎 Logos larger than 512 KB must be resized by the professional.

## Enforcement

- `apps/api/test/integration/account.http.test.ts` and `test/unit/auth-model.test.ts`
  (formats, signature, size).
- `apps/web/src/model/domain/prescriptions/Prescription.test.ts` (letterhead, PDF content).
- `jspdf` is only imported in `model/` (Biome forbids third-party UI libraries in views).

## References

- `apps/web/src/model/domain/prescriptions/`, `apps/api/src/modules/auth/model/ProfessionalLogo.ts`
