# Setup

How to get Mentora running on a new machine, with a demo account and test data ready to use.
For what the system does and where the code lives, read [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md).

## 1. Prerequisites

| Tool | Version | Needed for |
| --- | --- | --- |
| Docker Desktop (with Compose v2) | recent | Option A, and the database for option B |
| Node.js | 24 (`.nvmrc`) | Option B, tests and tooling |
| pnpm | 12 (`corepack enable`, or `npm i -g pnpm`) | Option B, tests and tooling |
| Git | any | Cloning |

Free ports: `8080` (web), `3000` (API), `27017` (MongoDB), `8025` and `1025` (Mailpit), and
`5173` for option B.

## 2. Clone and configure

```bash
git clone git@github.com:Org-Mentora/mentora-diploma.git
cd mentora-diploma
cp .env.example .env
```

`.env` is your local configuration and is git-ignored. Docker and `pnpm dev` both read it.

- **Set yourself:** change `JWT_SECRET` to any random string of at least 32 characters.
- **Leave as is:** everything else works for local use.
- **Full reference:** [docs/operations/configuration.md](docs/operations/configuration.md).

## 3A. Run everything in Docker (recommended for testing)

```bash
docker compose up --build -d
docker compose logs seed        # "seed: 8 patients, 8 consultations, ..."
```

| Open | What it is |
| --- | --- |
| <http://localhost:8080> | Web app. **Log in with `demo@mentora.test` / `Demo1234`** |
| <http://localhost:3000/api/docs> | Swagger UI of the API |
| <http://localhost:8025> | Mailpit: every email the API sends (recovery codes, billing) |
| `mongodb://localhost:27017/mentora?directConnection=true` | MongoDB (Compass, mongosh) |

How the containers use your `.env`:
- The API container loads every variable from `.env`.
- Compose only overrides what must point at other containers: `MONGO_URI`, `SMTP_URL`,
  `CORS_ORIGIN`, `APP_URL`, and `NODE_ENV=production`.
- To change prices, the trial length, providers or the demo account, edit `.env` and run
  `docker compose up -d` again.

### Demo data

The `seed` container runs once on every `docker compose up`. It waits for the API, then creates
everything through the public API, so the data follows the same rules as the app. If the demo
account already exists, it does nothing.

| Data | Details |
| --- | --- |
| Professional | Laura Gómez, Clinical Psychology, 2 offices, 14-day trial, Visa test card `•••• 4242`, monthly plan chosen |
| Patients (8) | Full and minimal profiles. Juan Pérez has insurance, a family contact and allergies. Martín Rodríguez has debt. Sofía Martínez has no phone, so her messages go by email. Diego López is discharged |
| Clinical records | 8 consultations with DSM-5 diagnoses (F41.1, F32.1, F43.10, F42.2, F43.21) and medications (sertraline, escitalopram, fluoxetine), dated 7 to 90 days ago |
| Agenda | 7 appointments in the next 7 days, in person and virtual (Ana Romero's is cancelled), with WhatsApp confirmations in each patient's "Messages" tab |
| Virtual consultation | A Jitsi meeting for Lucía Fernández's virtual appointment |
| Access log | Juan Pérez's record has view and register entries |

Seed settings in `.env`:

| Variable | Default | Effect |
| --- | --- | --- |
| `SEED_DEMO_DATA` | `true` | `false` skips the seed |
| `DEMO_EMAIL` / `DEMO_PASSWORD` | `demo@mentora.test` / `Demo1234` | Demo login. The password needs 8+ characters with a letter and a digit |

### Reset the database

```bash
docker compose down -v          # stops everything and deletes the MongoDB volume
docker compose up -d            # fresh database, the seed loads the demo data again
```

Appointment dates are relative to the day of the seed. Reset when they are in the past.

### Other Docker commands

| Command | What it does |
| --- | --- |
| `docker compose ps` | State of each container (`seed` shows `Exited (0)` when it finished) |
| `docker compose logs -f api` | API log. WhatsApp messages from the local outbox appear here |
| `docker compose down` | Stop, keeping the data |
| `docker compose -f docker-compose.yml -f docker-compose.dev.yml watch` | Containers with hot reload (web on :5173) |

## 3B. Run the apps on your machine (for development)

```bash
pnpm install                          # also installs the git hooks
docker compose up -d mongo mailpit    # only the database and the email inbox
pnpm dev                              # API :3000 (watch) + web :5173 (Vite)
pnpm seed                             # same demo data, against http://localhost:3000
```

Open <http://localhost:5173> and log in with `demo@mentora.test` / `Demo1234`.

## 4. Things to try with the demo account

| Use case | Where |
| --- | --- |
| Search and edit patients (CU-05, CU-06) | `/patients`; search "Pérez" or DNI `30123456` |
| Read a clinical record (CU-08, CU-11) | Juan Pérez → "Clinical record", "Diagnoses", "Access log" |
| Register a consultation (CU-09, CU-12) | Any patient → "New consultation" |
| Agenda (CU-10, CU-14) | `/agenda`; reschedule or cancel, then check the patient's "Messages" |
| Virtual consultation (CU-15) | Lucía Fernández's virtual appointment → "Start virtual consultation" |
| Prescription (CU-13) | Juan Pérez → "New prescription" → Print / Download PDF |
| Plan and payments (CU-18) | `/settings/plan`. Test cards are in [try-locally.md](docs/guides/try-locally.md) |
| Password recovery (CU-02) | Log out → "Forgot your password?" → read the code in Mailpit |

The full walkthrough of all 18 use cases is in [docs/guides/try-locally.md](docs/guides/try-locally.md).

## 5. Checks before committing

```bash
pnpm lint          # format, lint and architecture rules
pnpm typecheck
pnpm test          # API and web tests; MongoDB runs in memory, Docker not required
pnpm smoke         # end-to-end smoke test against http://localhost:8080 (option A running)
```

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `seed` exited with code 1 | `docker compose logs seed` shows the failing request. Usually the database holds old data: reset it |
| Login says the credentials are wrong | `DEMO_EMAIL` or `DEMO_PASSWORD` changed after the first seed. Reset the database or use the old values |
| Port already in use | Stop the other process, or stop `pnpm dev` before option A |
| API container restarts | `docker compose logs api`. A `JWT_SECRET` shorter than 32 characters is the usual cause |
| `ERR_PNPM_IGNORED_BUILDS` | `pnpm approve-builds` |
| First `pnpm test` is slow | `mongodb-memory-server` downloads MongoDB once |
