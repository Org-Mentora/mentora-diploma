# Runbook

Day-to-day operation of a production installation ([deployment.md](deployment.md)). All
commands assume:

```bash
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production"
```

## Monitoring

| Signal | Check | Alert when |
| --- | --- | --- |
| Web up | `GET https://<host>/healthz` | not 200 for 2 min |
| API ready | `GET https://<host>/api/health/ready` | 503 or timeout for 2 min |
| Container health | `$COMPOSE ps` | any service not `healthy` |
| Backups | newest `backups/mentora-*.archive.gz` | older than 26 h, or `backup: FAILED` in `$COMPOSE logs backup` |
| Offsite copy | newest object in the bucket | older than 2 days |
| Disk | `df -h` on the Docker data root and `BACKUP_DIR` | above 80 % |
| Errors | API logs with `"level":50` | sustained increase |
| Brute force | API logs with `TOO_MANY_REQUESTS` | many per hour from one IP |

An external uptime checker (any free one) on the two health URLs covers the first two lines.

## Logs

```bash
$COMPOSE logs -f --since 15m api          # JSON lines (pino)
$COMPOSE logs api | grep '<X-Request-Id value>'   # one request, from a user's report
$COMPOSE logs api | grep 'Scheduled job'               # jobs: registered, done, failed
```

Logs rotate at 10 MB × 5 files per container. Ship them to a log service if they must be kept
longer.

## Common incidents

### The API is not ready (503 on `/api/health/ready`)

1. `$COMPOSE ps`: is `mongo` healthy?
2. `$COMPOSE logs --tail 100 mongo`: disk full, key file permissions, replica set not initiated.
3. If MongoDB is fine, `$COMPOSE logs --tail 100 api` for connection errors (wrong
   `MONGO_APP_PASSWORD` after a rotation).
4. `/api/health/live` still answers while MongoDB is down; the container is not restarted, it
   recovers by itself when MongoDB is back.

### Users get 429 "Too many attempts"

Expected after repeated failed logins or recovery requests. Limits reset after the window
(15 min or 1 h, see `Retry-After`). Limits are in memory: `$COMPOSE restart api` clears them.
If one IP is attacking, block it at the TLS proxy.

### Emails do not arrive

1. `$COMPOSE logs api | grep -i mail` for SMTP errors.
2. Check `SMTP_URL` credentials and that the relay accepts `MAIL_FROM` (SPF/DKIM for the domain).
3. Recovery emails are sent after the response; users can request a new code.

### WhatsApp messages fail

Every attempt is in the `notifications` collection and on the Notifications screen with its error.
With `WHATSAPP_PROVIDER=cloud-api`, permanent errors usually mean an expired token or a template
that is not approved (ADR-0030).

### Payments fail

`503 PAYMENT_PROVIDER_UNAVAILABLE` means the gateway did not answer; the payment is recorded as
failed and can be retried. Renewal failures are retried every hour; after 3 provider errors the
subscription is suspended and the professional is emailed (ADR-0029).

### A job did not run

`$COMPOSE logs api | grep 'Scheduled job'`. A job is skipped while another instance holds its
lease in `job_locks`; a lease expires after one interval if an instance died.

## Routine tasks

| When | Task |
| --- | --- |
| Daily | Check the backup and offsite alerts |
| Weekly | Merge Dependabot PRs; release and deploy if there are security fixes |
| Monthly | Restore drill on staging ([backup-and-restore.md](backup-and-restore.md#restore-drill)) |
| Monthly | `docker system df` and `docker image prune` on the host |
| Quarterly | Rotate `JWT_SECRET` and the MongoDB passwords; review access to the host and GHCR |
| Yearly | Renew provider credentials (WhatsApp token, Google OAuth) before they expire |

## Rotate a secret

- `JWT_SECRET`: change it in `.env.production`, `$COMPOSE up -d api`. Every session ends; users
  log in again.
- MongoDB application password:

  ```bash
  $COMPOSE exec mongo mongosh -u root -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin \
    --eval 'db.getSiblingDB("mentora").changeUserPassword("mentora", "<new>")'
  # update MONGO_APP_PASSWORD in .env.production, then:
  $COMPOSE up -d api
  ```

- Backup password: same with `db.getSiblingDB("admin").changeUserPassword("backup", "<new>")`, then
  `$COMPOSE up -d backup`.

## Scale the API

Run more API replicas behind the web nginx (`$COMPOSE up -d --scale api=2`, then
`$COMPOSE restart web` so nginx resolves the new containers). Jobs stay single-run
thanks to `MongoJobLock`. Rate limits are shared through MongoDB (ADR-0040).
