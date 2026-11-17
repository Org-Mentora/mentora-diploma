# Configuration

Every setting is an environment variable, validated at start-up by `AppConfig`
(`apps/api/src/infrastructure/config/AppConfig.ts`). An invalid value stops the API with a clear
message instead of failing later.

- Development: `.env` at the repository root (copy `.env.example`; git-ignored).
- Production: `.env.production` (copy `.env.production.example`; git-ignored), read by
  `docker-compose.prod.yml`. The compose file fixes some values for production (column "Prod").

## API

| Variable | Default | Prod | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | `development` | `production` | `production` refuses the development `JWT_SECRET` |
| `PORT` | `3000` | `3000` | HTTP port inside the container |
| `MONGO_URI` | `mongodb://localhost:27017/mentora?directConnection=true` | built from `MONGO_APP_PASSWORD` | Must point to a replica set (transactions, ADR-0025) |
| `MONGO_MAX_POOL_SIZE` | `20` | `20` | Connections in the single pool shared by every repository (`MongoConnection` Singleton) |
| `LOG_LEVEL` | `info` | `info` | `fatal` `error` `warn` `info` `debug` `trace` `silent` |
| `CORS_ORIGIN` | `http://localhost:5173` | `APP_URL` | Allowed browser origin |
| `APP_URL` | `http://localhost:5173` | **required** | Public web URL, base of links in emails |
| `APP_TIMEZONE` | `America/Argentina/Buenos_Aires` | same | Time zone of dates in emails and WhatsApp messages |
| `JWT_SECRET` | development value | **required** | At least 32 characters. Changing it logs everyone out |
| `SESSION_TTL_SECONDS` | `28800` (8 h) | same | Session cookie and token lifetime |
| `TRIAL_DAYS` | `14` | same | Free trial for new professionals (CU-03) |
| `SCHEDULER_ENABLED` | `true` | `true` | Runs reminders, inactivation and renewals (ADR-0026) |
| `RATE_LIMIT_ENABLED` | `true` | `true` | Limits on login, register and recovery (ADR-0037) |
| `TRUST_PROXY` | `0` | `2` | Number of proxies in front of the API (TLS proxy + web nginx), used to read the client IP for rate limits |
| `SHUTDOWN_TIMEOUT_MS` | `10000` | same | Time to finish requests and jobs on `SIGTERM`. Keep it below the compose `stop_grace_period` (20 s) |
| `SMTP_URL` | `smtp://localhost:1025` | **required** | SMTP relay. Locally Mailpit (ADR-0027) |
| `MAIL_FROM` | `Mentora <no-reply@mentora.local>` | **required** | Sender of every email |
| `WHATSAPP_PROVIDER` | `local` | `local` | `local` records messages in the outbox; `cloud-api` sends them (ADR-0030) |
| `WHATSAPP_TOKEN` | — | if `cloud-api` | Meta access token |
| `WHATSAPP_PHONE_NUMBER_ID` | — | if `cloud-api` | Sender phone number id |
| `WHATSAPP_API_VERSION` | `v21.0` | same | Graph API version |
| `MEETING_PROVIDER` | `jitsi` | `jitsi` | `jitsi` or `google-meet` (ADR-0031) |
| `JITSI_BASE_URL` | `https://meet.jit.si` | same | Use your own Jitsi server here |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REFRESH_TOKEN` | — | if `google-meet` | OAuth credentials of the calendar owner |
| `GOOGLE_CALENDAR_ID` | `primary` | same | Calendar where meetings are created |
| `PLAN_MONTHLY_PRICE` | `25000` | same | Monthly plan price in ARS (ADR-0029) |
| `PLAN_ANNUAL_PRICE` | `250000` | same | Annual plan price in ARS |

## Production compose only

| Variable | Default | Description |
| --- | --- | --- |
| `MENTORA_VERSION` | `latest` | Image tag to run (`1.4.0`, `sha-1a2b3c4`). Pin a version in production |
| `PUBLIC_PORT` | `8080` | Host port of the web container; the TLS proxy forwards to it |
| `PUBLIC_BIND` | `127.0.0.1` | Host address the web port binds to; keep it local so only the TLS proxy reaches it |
| `MONGO_ROOT_USER` | `root` | MongoDB administrator (used only for maintenance) |
| `MONGO_ROOT_PASSWORD` | **required** | Administrator password |
| `MONGO_APP_PASSWORD` | **required** | Password of `mentora` (`readWrite` on `mentora`), used by the API |
| `MONGO_BACKUP_PASSWORD` | **required** | Password of `backup` (`backup` and `restore` roles) |
| `BACKUP_INTERVAL_HOURS` | `24` | Time between dumps (ADR-0039) |
| `BACKUP_RETENTION_DAYS` | `14` | Local retention of dumps |
| `BACKUP_DIR` | `./backups` | Host directory of the dumps. Copy it offsite |

MongoDB passwords are set when the `mongo-data` volume is created. Changing them later needs
`db.changeUserPassword()` as well (see [runbook](runbook.md#rotate-a-secret)).

## Web

| Variable | Where | Default | Description |
| --- | --- | --- | --- |
| `VITE_API_URL` | build time | `/api` | API base URL. Keep `/api`: nginx proxies it, so cookies stay same-site |
| `API_UPSTREAM` | web container | `http://api:3000` | Where nginx forwards `/api` |

## Tools

| Variable | Used by | Default |
| --- | --- | --- |
| `BASE_URL` | `pnpm smoke` | `http://localhost:8080` |
| `SMOKE_WAIT_SECONDS` | `pnpm smoke` | `90` (waits for `/api/health/ready`) |
| `SEED_DEMO_DATA` | local compose `seed`, `pnpm seed` | `true`; `false` skips the demo data (ADR-0043) |
| `DEMO_EMAIL` / `DEMO_PASSWORD` | local compose `seed`, `pnpm seed` | `demo@mentora.test` / `Demo1234` |
| `SEED_BASE_URL` | `pnpm seed` | `http://localhost:3000` |
| `BACKUP_DIR` | `pnpm db:backup` | `backups` |
| `MONGO_DATABASE` | backup and restore scripts | `mentora` |

## Secrets

- Generate each secret with `openssl rand -base64 48`.
- Never commit `.env` or `.env.production`. Both are in `.gitignore`; only the `*.example` files
  are tracked.
- Store the production values in a password manager or the host's secret store. The backup of
  the secrets is as important as the database backup: without `MONGO_*_PASSWORD` a restored
  volume cannot be opened, and without `JWT_SECRET` every session ends.
