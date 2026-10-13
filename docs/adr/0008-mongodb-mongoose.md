# ADR-0008: MongoDB with Mongoose

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** backend, persistence
- **Supersedes:** —

## Context and problem statement

The API needs a persistent store. The team is most productive with a document database, and the
domain is expected to have aggregates that map well to documents.

## Decision drivers

- Team familiarity and fast iteration.
- Schemas and validation at the persistence level.
- Easy local and CI setup (Docker and in-memory server).

## Considered options

1. MongoDB 8 + Mongoose
2. PostgreSQL + Drizzle
3. PostgreSQL + Prisma

## Decision outcome

Chosen option: **MongoDB 8 + Mongoose 9.**

- Mongoose is used **only** in `apps/api/src/infrastructure/database` and in
  `apps/api/src/modules/*/infrastructure` ([ADR-0007](0007-adapter-pattern.md)).
- **Ids:** entities use UUID strings (`crypto.randomUUID()`), stored as the document `_id: String`.
  `ObjectId` never reaches the Model or the API.
- Repositories extend `MongooseRepository<Entity, Document>` and supply a schema model + a
  `DataMapper`. `save()` is an upsert (`replaceOne` with `upsert: true`).
- One connection per process through the `MongoConnection` singleton
  ([ADR-0006](0006-singleton-pattern.md)).
- Integration tests use `mongodb-memory-server`; Compose runs `mongo:8`.

### Consequences

- 👍 Fast schema evolution; no migrations for additive changes.
- 👎 No multi-document transactions without a replica set. If a use case needs them, the
  Compose file must switch to a single-node replica set (record a new ADR).

## Enforcement

Layer rules in `biome.json` forbid `mongoose` outside infrastructure folders.

## References

- `apps/api/src/infrastructure/database/*`, `apps/api/test/integration/mongoose-repository.test.ts`
