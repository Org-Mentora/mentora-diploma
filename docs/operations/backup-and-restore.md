# Backup and restore plan

Decision and alternatives: [ADR-0039](../adr/0039-database-backup-strategy.md). This page is
the procedure.

## Objectives

| Objective | Target | How |
| --- | --- | --- |
| RPO (data that can be lost) | 24 h | One dump every `BACKUP_INTERVAL_HOURS` (24) |
| RTO (time to be back) | 1 h | One `mongorestore` of the archive plus the smoke test |
| Local retention | 14 days | `BACKUP_RETENTION_DAYS`, deleted by `backup.sh` |
| Offsite retention | 30 daily + 12 monthly | Object storage lifecycle rules |
| Proven restore | every PR + monthly | CI drill + manual drill below |

## What is backed up

| Data | Where | Backed up by |
| --- | --- | --- |
| Every collection of the `mentora` database (professionals, patients, clinical records, appointments, subscriptions, payments, notifications, logos, recovery codes, job locks, migrations) | MongoDB volume `mongo-data` | `mongodump` archive |
| MongoDB users | `admin` database | Recreated from `docker/mongo/init-users.js` and the secrets |
| Replica set key file | volume `mongo-keys` | Regenerated; only needs to be the same for every member |
| Secrets (`.env.production`) | host | **Operator**: password manager / secret store |
| Images | GHCR | Rebuildable from the git tag |

Prescriptions are not stored (ADR-0032) and WhatsApp/email copies live in the `notifications`
collection, so the database dump is the only stateful thing to protect.

## How the automatic backup works

The `backup` service in `docker-compose.prod.yml` runs `docker/backup/schedule.sh`, which calls
`backup.sh` right away and then every `BACKUP_INTERVAL_HOURS`:

1. `mongodump --db mentora --gzip --archive` as the `backup` user, written to
   `mentora-<UTC>.archive.gz.partial`.
2. Renamed to `mentora-<UTC>.archive.gz` only when the dump succeeded, so a half-written file never
   looks like a backup.
3. `mentora-<UTC>.archive.gz.sha256` written next to it.
4. Files older than `BACKUP_RETENTION_DAYS` deleted.

A failed run prints `backup: FAILED` and the loop continues. Watch for it (see
[runbook](runbook.md#monitoring)).

Take a backup on demand (before an upgrade, before a manual data fix):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec backup sh /scripts/backup.sh
```

## Offsite copy

Backups on the same disk as the database do not survive the loss of the host. Copy `BACKUP_DIR`
to storage in another account or provider at least daily, for example with `rclone` and a
crontab on the host:

```bash
# /etc/cron.d/mentora-offsite: every day at 03:30 UTC
30 3 * * * root rclone copy /srv/mentora/backups offsite:mentora-backups --include 'mentora-*' \
  --max-age 48h --log-file /var/log/mentora-offsite.log
```

- The bucket has versioning and object lock (or an equivalent), so a compromised host cannot
  delete old backups.
- Encrypt the copy (rclone `crypt` remote or server-side encryption with a key that is not on the
  host). Dumps contain clinical data.
- Lifecycle: keep daily objects 30 days, and the first dump of each month for 12 months.

## Restore

Restoring replaces every collection of `mentora` with the content of the archive.

```bash
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production"

# 1. Stop writes.
$COMPOSE stop api web

# 2. Put the archive (and its .sha256) in BACKUP_DIR if it comes from the offsite copy.
ls backups/

# 3. Restore (checks the sha256 first and aborts on a mismatch).
$COMPOSE exec backup sh /scripts/restore.sh /backups/mentora-20261117T030000Z.archive.gz

# 4. Start and verify.
$COMPOSE up -d --wait api web
curl -fsS http://localhost:8080/api/health/ready
```

Then log in as a known professional and open a patient with recent consultations. Data written
after the backup time is lost; tell the affected professionals.

If the whole host is lost: provision a new host ([deployment.md](deployment.md)), restore
`.env.production` from the secret store, start only `mongo`, `mongo-keyfile` and `backup`, run step
3 with the latest offsite archive, then start everything.

## Restore drill

`tools/ops/restore-drill.sh` proves that a dump can be restored: it counts the documents of the
main collections, takes a backup, deletes patients and appointments, restores, and compares the
counts.

- **CI**: runs on every pull request against the production images (ADR-0036).
- **Monthly, by the operator**: on a staging host restored from the latest offsite archive:

  ```bash
  bash tools/ops/restore-drill.sh -f docker-compose.prod.yml --env-file .env.production
  BASE_URL=http://localhost:8080 node tools/smoke/smoke.mjs
  ```

  Record the date, archive name and duration in the operations log. If the restore takes more
  than the RTO, revisit ADR-0039.

Never run the drill against production: it deletes data before restoring it.

## Development database

```bash
pnpm db:backup                                   # → backups/mentora-dev-<UTC>.archive.gz
pnpm db:restore backups/mentora-dev-<UTC>.archive.gz
```

Both use the `mongo` container of `docker-compose.yml`. `backups/` is git-ignored.
