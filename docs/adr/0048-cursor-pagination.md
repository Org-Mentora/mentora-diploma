# ADR-0048: Cursor pagination for every list endpoint

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, frontend, api, data
- **Supersedes:** — (amends the pattern list of [ADR-0035](0035-comments-name-design-patterns.md): adds `Iterator`)

## Context and problem statement

List endpoints returned whole collections: every patient of a professional, every payment, every
notification or video call of a patient, the whole access log, every booking request. A few
had ad-hoc caps (`limit(200)`, "latest 100") that silently hid older data, and only the audit
trail had a cursor of its own (`before` / `nextBefore`). Growing accounts make these responses
slow and heavy, and the requirement is that no list is read in full: one page at a time, 20
records by default.

## Decision drivers

- No unbounded `find()` behind an HTTP list. Pages stay correct while data is being added.
- One contract for every list, so the web consumes them all the same way.
- Respect the layers: the Model knows pages, not Mongo or HTTP; cursors are opaque to clients.
- Reasonable cost: no `countDocuments` per request, use the existing sort indexes.

## Considered options

1. Offset pagination (`page`, `pageSize`, `total`).
2. Keyset (cursor) pagination with an opaque cursor.
3. Keep full lists and paginate only in the browser.

## Decision outcome

Chosen option: **2. Keyset pagination with an opaque cursor**, because `skip` gets slower with
each page and repeats or skips rows when records are inserted between requests, and option 3
does not reduce what the API reads or sends.

- **Contract** (`#core/contracts/Pagination`): list queries extend `PageQuerySchema`
  (`cursor?`, `limit?` 1–100). Responses are `pageOf(ItemSchema, 'XxxPageDto')`:
  `{ items, nextCursor }`, where `nextCursor` is null on the last page. The default page size is
  **20** and the maximum is **100**.
- **Model** (`#core/model/Pagination`): `PageRequest` (Value Object, `limit` + decoded `after`
  key) and `Page<T>` (`items`, `next`). Repositories take a `PageRequest` and return a `Page`.
  Collections embedded in an aggregate (consultations and diagnosis history of the
  `ClinicalRecord`, ADR-0020) are cut with `PageRequest.slice`, which is safe because they are
  append-only.
- **Infrastructure** (`#infrastructure/database/Keyset`): a Strategy per sort order (for example
  `createdAt desc, _id desc`). It builds the `$or` "after this key" filter, the sort, and asks for
  `limit + 1` rows to know whether there is a next page. `_id` is always the last field, so keys
  are unique.
- **Presenter** (`CursorCodec`): encodes the key as base64url JSON and decodes it back. A
  tampered or foreign cursor is a `400 VALIDATION_ERROR` (`field: cursor`).
- **Endpoints**: patients, appointments (inside the 62-day range), booking requests, payments,
  notifications, virtual meetings, diagnosis catalog, clinical record consultations, diagnosis
  history, record access log and the audit trail. The audit trail moves from `before` /
  `nextBefore` to `cursor` / `nextCursor`. Internal batch reads (scheduled jobs) already use a
  `limit` and are not HTTP lists.
- **Web** (`@/model/api/usePagedQuery`, Iterator): ViewModels pass the generated RTK Query hook
  and the filters. The hook keeps the loaded pages, exposes `items`, `hasMore`, `loadMore` and
  `refresh`, and starts again from page one when the filters change. Views render
  `<LoadMore>` from `@/shared/ui/load-more`. The agenda month view uses `loadAll` (pages of 100)
  because the calendar needs every appointment of the month.

### Consequences

- 👍 Each request reads at most `limit + 1` documents through the sort indexes, and pages stay
  stable while new records arrive.
- 👍 The same contract, error and UI control are used for every list. Old caps that hid data
  ("latest 100", `limit(200)`) are gone: older records are one "Load more" away.
- 👎 No total count and no jumping to page N. Lists are read forward only.
- 👎 A mutation re-fetches only the page the list is subscribed to. ViewModels call `refresh()`
  after their own changes when later pages could be stale.
- 👎 Embedded collections still load the whole aggregate from Mongo. Only the response is paged.
  Moving consultations to their own collection would need a new ADR superseding ADR-0020.
- 👎 Breaking API change: list responses are objects instead of arrays.

## Enforcement

- `test/unit/pagination.test.ts` (defaults, cap, cursor round trip, keyset filter, slicing) and
  `patients.http.test.ts` (walks every page and rejects bad cursors and `limit > 100`).
- `usePagedQuery.test.ts` covers appending, `loadAll` and resetting on filter changes.
- Review: a new list route uses `PageQuerySchema` + `pageOf`, and its repository returns a `Page`.
  `pnpm codegen:check` in CI keeps the generated hooks in sync.
- `pnpm lint:comments` accepts `// Iterator`.

## References

- `apps/api/src/core/model/Pagination.ts`, `core/presenter/CursorCodec.ts`,
  `core/contracts/Pagination.ts`, `infrastructure/database/Keyset.ts`
- `apps/web/src/model/api/usePagedQuery.ts`, `apps/web/src/shared/ui/load-more.tsx`
