# Production readiness

Where Mentora stands, section by section. ✅ done and verified, ⚠️ partial, ❌ not done yet.
Each gap says what to do next. Review this page before every major release.

## Summary

| Section | Status | Main gap |
| --- | --- | --- |
| [Security](#security) | ⚠️ | No external security review |
| [Reliability](#reliability) | ⚠️ | One MongoDB node, one host |
| [Observability](#observability) | ⚠️ | Logs only on the host; no metrics or tracing |
| [Data](#data) | ✅ | Offsite copy is a manual setup step |
| [Delivery](#delivery) | ✅ | Deployment is a manual command |
| [Operations](#operations) | ✅ | No on-call rotation yet |
| [Compliance and privacy](#compliance-and-privacy) | ⚠️ | Legal review of health-data handling pending |
| [Product](#product) | ⚠️ | Simulated payment gateway; WhatsApp templates |

## Security

| Item | Status | Where / next step |
| --- | --- | --- |
| Passwords hashed with scrypt, policy enforced | ✅ | ADR-0018 |
| Session in an `httpOnly`, `SameSite` cookie, signed JWT, 8 h TTL | ✅ | ADR-0018 |
| Password change or reset ends the other sessions | ✅ | ADR-0034 |
| Every query scoped by `professionalId`; foreign data → 404 | ✅ | ADR-0019, HTTP tests |
| Input validated by zod contracts at the edge | ✅ | ADR-0009 |
| Rate limits on login, register and recovery (429 + `Retry-After`) | ✅ | ADR-0037 |
| Recovery codes hashed, 15 min, 5 attempts, same answer for unknown emails | ✅ | ADR-0028 |
| Security headers: helmet on the API; CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` on nginx | ✅ | `docker/nginx/default.conf.template` |
| Containers non-root, read-only, `no-new-privileges`; MongoDB with auth and least-privilege users | ✅ | ADR-0038 |
| Secrets only in git-ignored env files; production refuses the development `JWT_SECRET` | ✅ | `AppConfig`, [configuration.md](configuration.md) |
| Dependency audit, dependency review, CodeQL, Dependabot, actions pinned by SHA | ✅ | ADR-0036 |
| HTTPS with HSTS | ⚠️ | Done by the TLS proxy in front ([deployment.md](deployment.md#tls-in-front-of-the-web-container)); not part of the stack |
| Shared rate-limit store across API instances | ✅ | `MongoRateLimitStore` (ADR-0040) |
| Card data never reaches the API | ⚠️ | The simulated gateway receives card numbers; a real provider must tokenize in the browser (ADR-0029) |
| Container image vulnerability scanning | ❌ | Re-evaluate a scanner (Grype, Docker Scout) pinned by digest; Trivy action excluded (ADR-0036) |
| Penetration test / external review | ❌ | Before onboarding real patients |
| Audit log of who read which clinical record | ✅ | `clinical_record_access`, Access log tab (ADR-0040); IP and device not stored |

## Reliability

| Item | Status | Where / next step |
| --- | --- | --- |
| Liveness and readiness probes, used by the image health checks | ✅ | ADR-0037 |
| Graceful shutdown: drains requests and jobs, forced exit after a timeout | ✅ | `main.ts`, `stop_grace_period` 20 s |
| Multi-document writes in transactions | ✅ | ADR-0025 |
| External calls (payments, WhatsApp, email) outside transactions, idempotent charges | ✅ | ADR-0029, ADR-0030 |
| Scheduled jobs idempotent and single-run across instances | ✅ | ADR-0026, `MongoJobLock` |
| One-off migrations run once | ✅ | `MigrationLog` |
| Restart policy and memory limits on every container | ✅ | `docker-compose.prod.yml` |
| Database failover | ❌ | Single node. Move to a 3-member replica set or MongoDB Atlas |
| Host failover | ❌ | Single host. RTO 1 h by restore ([backup-and-restore.md](backup-and-restore.md)) |
| Double booking of the same slot under concurrency | ✅ | Agenda lock per professional inside the booking transaction (ADR-0040) |
| Data migrations run once even when several API instances start together | ✅ | `MongoJobLock` around `runMigrations()` in `main.ts` |
| Clinical record size | ⚠️ | Consultations are embedded (ADR-0020); about 500 maximum-size consultations reach the 16 MB document limit. Move consultations to their own collection before a patient gets close |
| Load test | ❌ | Run k6 against staging before launch to size the host |

## Observability

| Item | Status | Where / next step |
| --- | --- | --- |
| Structured JSON logs (pino) with levels | ✅ | ADR-0007 |
| `X-Request-Id` on every response and in the request log | ✅ | ADR-0037 |
| Job start, finish and failure logged; renewal report per run | ✅ | `IntervalJobScheduler`, `SubscriptionsModule` |
| Delivery log of every WhatsApp message with status and error | ✅ | ADR-0030, Notifications screen |
| Log retention | ⚠️ | 10 MB × 5 files per container; ship to a log service for longer |
| Metrics (latency, error rate, job duration) | ❌ | Expose Prometheus metrics or use OpenTelemetry |
| Error tracking for the SPA | ❌ | Add an error reporter (e.g. Sentry) behind an adapter |
| Uptime alerts | ⚠️ | Documented checks ([runbook.md](runbook.md#monitoring)); configure an external checker |

## Data

| Item | Status | Where / next step |
| --- | --- | --- |
| Daily dumps with checksum and 14-day retention | ✅ | ADR-0039 |
| Backup user with only `backup`/`restore` roles | ✅ | `docker/mongo/init-users.js` |
| Restore verified on every PR (drill + smoke) | ✅ | CI e2e |
| RPO 24 h / RTO 1 h defined | ✅ | [backup-and-restore.md](backup-and-restore.md) |
| Offsite, encrypted, immutable copy | ⚠️ | Procedure documented; must be set up on the host |
| Encryption at rest | ⚠️ | Use an encrypted disk on the host or Atlas encryption |
| Point-in-time recovery | ❌ | Atlas continuous backup when RPO must be below a day |

## Delivery

| Item | Status | Where / next step |
| --- | --- | --- |
| Required CI checks: lint, architecture, comments, types, tests, build, generated code, class diagram, audit, commits | ✅ | ADR-0036 |
| E2E on the production images: smoke + restore drill | ✅ | `ci.yml` |
| Versioned multi-arch images with SBOM and provenance | ✅ | `release.yml` |
| Conventional commits and SemVer tags | ✅ | Lefthook, [ci-cd.md](ci-cd.md#releasing) |
| Rollback by image tag | ✅ | [deployment.md](deployment.md#rollback) |
| Automated deployment | ❌ | Add a deploy job (SSH + compose pull) gated on a GitHub environment with approval |
| Staging environment | ❌ | A second host from the same compose file |

## Operations

| Item | Status | Where / next step |
| --- | --- | --- |
| Deployment, configuration, backup and runbook documented | ✅ | `docs/operations` |
| Secret rotation procedure | ✅ | [runbook.md](runbook.md#rotate-a-secret) |
| Architecture, class and sequence diagrams match the code | ✅ | [class-diagram.md](../architecture/class-diagram.md) (generated), [sequence-diagrams.md](../architecture/sequence-diagrams.md) |
| Security reporting policy | ✅ | [SECURITY.md](../../SECURITY.md) |
| On-call and incident process | ❌ | Define who is paged and a post-mortem template |

## Compliance and privacy

Mentora stores health data of patients in Argentina (Ley 25.326 de Protección de Datos
Personales and Ley 26.529 de Derechos del Paciente, which covers the clinical record).

| Item | Status | Where / next step |
| --- | --- | --- |
| Clinical record consultations are append-only | ✅ | ADR-0020 |
| Data isolated per professional | ✅ | ADR-0019 |
| Patients are inactivated, never deleted | ✅ | CU-05, CU-06 |
| Registration of the database with the AAIP (national data protection agency) | ❌ | Legal task |
| Retention policy for clinical records (at least 10 years) and for backups | ⚠️ | Backups follow ADR-0039; records are never deleted; formalize it |
| Terms of service and privacy policy accepted at registration | ❌ | Product and legal task |
| Access log of clinical records | ❌ | See Security |

## Product

| Item | Status | Next step |
| --- | --- | --- |
| All 18 use cases implemented and tested | ✅ | [mvp-scope.md](../product/mvp-scope.md) |
| Real payment provider | ❌ | Replace `SimulatedPaymentGateway` with a `PaymentGateway` adapter (e.g. Mercado Pago) and tokenize in the browser |
| WhatsApp approved templates | ❌ | Needed by the Cloud API for messages outside the 24 h window |
| Email fallback for CU-15 invitations | ❌ | Send the link by email when the patient has no phone |
