# ADR-0039: Database backup strategy

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** ops, data
- **Supersedes:** —

## Context and problem statement

Mentora stores clinical records, which must not be lost and must be kept for years. MongoDB ran
on a single node with no backups. We need a plan that works with the single-host deployment
(ADR-0038), is cheap, and is proven to restore.

## Decision drivers

- Losing at most one day of data is acceptable for the MVP; losing the database is not.
- A backup that was never restored is not a backup.
- Backups contain health data: they must be protected like the database.
- No paid service required to start.

## Considered options

1. Scheduled logical dumps (`mongodump`) in a sidecar container, checksums, retention, offsite
   copy and an automated restore drill.
2. File-system or volume snapshots.
3. A managed database with point-in-time recovery (MongoDB Atlas).

## Decision outcome

Chosen option: **1. Scheduled `mongodump` with an automated restore drill.** Atlas (continuous
backups, point-in-time recovery) is the upgrade path when the RPO must drop below a day.

- **What.** `mongodump --db mentora --gzip --archive`: one compressed file per run with every
  collection of the application database. Users and the key file are recreated from
  configuration, so they are not part of the dump.
- **When and where.** The `backup` service runs `backup.sh` every `BACKUP_INTERVAL_HOURS` (24) and
  writes `mentora-<UTC timestamp>.archive.gz` plus a `.sha256` file to `BACKUP_DIR`. A file is
  written as `.partial` and renamed when complete.
- **Retention.** Files older than `BACKUP_RETENTION_DAYS` (14) are deleted by the same script.
  The offsite copy keeps 12 monthly archives.
- **Offsite.** The operator copies `BACKUP_DIR` daily to storage on another provider or account
  (for example `rclone` to an object storage bucket with versioning and encryption). See
  `docs/operations/backup-and-restore.md`.
- **Access.** The dump runs as the `backup` user (`backup` + `restore` roles), never as root or
  the application user.
- **Restore.** `restore.sh` verifies the checksum, then runs
  `mongorestore --drop --nsInclude "mentora.*"`. Restores replace the whole application database.
- **Objectives.** RPO 24 h (backup interval), RTO 1 h (restore of an MVP-sized database plus
  smoke test).
- **Drill.** `tools/ops/restore-drill.sh` takes a backup, deletes data, restores and compares
  document counts. CI runs it on every pull request; the operator runs it monthly against a copy
  of production.
- **Development.** `pnpm db:backup` and `pnpm db:restore <file>` do the same against the local
  Compose MongoDB; `backups/` is git-ignored.

### Consequences

- 👍 Restores are tested on every pull request, not only when disaster strikes.
- 👍 Simple files: easy to encrypt, copy and inspect.
- 👎 Up to 24 h of data can be lost; logical dumps get slow for databases of many GB.
- 👎 The offsite copy is an operator task until it is automated on the target host.

## Enforcement

- CI e2e job runs the restore drill and a smoke test after it (ADR-0036).
- The monthly drill is a line in `docs/operations/runbook.md`.

## References

- ADR-0008, ADR-0025, ADR-0036, ADR-0038
- MongoDB manual: `mongodump`, `mongorestore`, built-in `backup` and `restore` roles
