# ADR-0025: Database transactions through a transaction context

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, persistence, patterns
- **Supersedes:** —

## Context and problem statement

Several use cases read, check and then write: registering a professional (unique email and
license), registering or editing a patient (unique DNI), appending a consultation to a clinical
record and scheduling appointments. Without transactions, concurrent requests interleave
between the read and the write. For example, two consultations registered at the same time on
one record lose all but one write or fail with a 500. ADR-0008 left transactions out because
MongoDB only supports them on a replica set, and asked for a new ADR when a use case needs them.

## Decision drivers

- The Model decides where a unit of work starts and ends, without knowing about MongoDB.
- Repositories join the running transaction automatically. Model methods do not pass a
  session parameter around.
- It must keep the layer rules (ADR-0004), the Adapter pattern (ADR-0007) and constructor
  injection (ADR-0006).
- It must work the same way in Compose, `pnpm dev` and the tests.

## Considered options

1. `TransactionManager` in the Model + a `TransactionContext` (AsyncLocalStorage) in
   infrastructure that carries the session to the repositories.
2. Pass a `session` argument through every service and repository method.
3. Mongoose's global `transactionAsyncLocalStorage` option.

## Decision outcome

Chosen option: **1. A Model-owned `TransactionManager` and an injected `TransactionContext`**.
Option 2 would put a Mongo type in every Model signature. Option 3 is a hidden global switch
that the tests and the code cannot see.

- `#core/model/TransactionManager` (abstract): `run<T>(work: () => Promise<T>): Promise<T>`.
  Model services take it in the constructor and wrap each write use case in `run`. The work
  commits when it resolves and rolls back when it throws (an `ApplicationError` too). A nested
  `run` joins the outer transaction.
- `#infrastructure/database/TransactionContext`: the **transaction ctx**. An
  `AsyncLocalStorage<ClientSession>` that holds the session of the running transaction, or
  `null` outside one.
- `#infrastructure/database/MongoTransactionManager` (adapter): calls Mongoose
  `connection.transaction()`, which commits, aborts and retries transient errors such as write
  conflicts, and runs the work inside `context.runWith(session, ...)`.
- `MongooseRepository` receives the context in its constructor. **Every query passes
  `.session(this.session)` (or `{ session: this.session ?? undefined }` in options).**
- `src/app/modules.ts` creates one `TransactionContext` and one `MongoTransactionManager`, and
  injects them into the modules.
- **The work may run more than once** because of retries. It only reads and writes through
  repositories. Side effects such as notifications (CU-14) run after `run` resolves.
- Repository calls inside one `run` are awaited one after another, never in parallel
  (`Promise.all`), because a MongoDB session does not support parallel operations in a
  transaction.
- The read-only DSM-5 catalog repository does not join transactions (reference data).
- MongoDB runs as a **single-node replica set** (`rs0`) in Compose. URIs use
  `?directConnection=true`. Tests use `MongoMemoryReplSet`. `MongoConnection.connect` fails
  fast with a clear message if the server is a standalone.

### Consequences

- 👍 Read-check-write use cases are atomic. Concurrent appends to a clinical record are
  retried instead of lost.
- 👍 The Model stays database-agnostic. Unit tests can use a fake `TransactionManager` that
  simply calls `work()`.
- 👎 A standalone `mongod` no longer works. Developers must use the Compose service or another
  replica set.
- 👎 A query that forgets `.session(this.session)` runs outside the transaction without any
  error. Reviews must check it.
- 👎 Snapshot isolation does not prevent write skew between *different* documents. The
  appointment overlap check is still not fully safe against two simultaneous bookings. That
  needs a lock document or a unique slot key (future ADR).

## Enforcement

- `apps/api/test/integration/mongoose-repository.test.ts` covers commit, rollback, isolation,
  nesting and the context lifecycle.
- `apps/api/test/integration/clinical-records.http.test.ts` registers consultations in
  parallel and expects all of them to be stored.
- Biome keeps `mongoose` out of `core/` and the Model, so `TransactionManager` cannot leak
  sessions into the Model.
- Code review: every new repository query calls `.session(this.session)`.

## References

- [ADR-0008](0008-mongodb-mongoose.md) (consequence about replica sets),
  [ADR-0007](0007-adapter-pattern.md), [ADR-0006](0006-singleton-pattern.md)
- `apps/api/src/core/model/TransactionManager.ts`,
  `apps/api/src/infrastructure/database/{TransactionContext,MongoTransactionManager,MongooseRepository}.ts`
- <https://mongoosejs.com/docs/transactions.html>
