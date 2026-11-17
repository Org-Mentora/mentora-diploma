# ADR-0026: In-process scheduled jobs declared by modules

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, patterns
- **Supersedes:** —

## Context and problem statement

Three use cases need work that no request triggers: CU-07 marks patients inactive after three
months without consultations, CU-14 reminds patients before their appointments, and CU-18
charges renewals when a period ends. The API had no way to run periodic work.

## Decision drivers

- Each module owns its background work, like it owns its routes.
- No extra infrastructure to run locally (no queue, no cron container).
- Jobs must be testable without waiting for timers.

## Considered options

1. `AppModule.scheduledJobs()` + an in-process `IntervalJobScheduler` started by `main.ts`.
2. A job library with persistence (Agenda, BullMQ + Redis).
3. Operating-system cron calling HTTP endpoints.

## Decision outcome

Chosen option: **1. Jobs declared by modules, run in process.**

- `#core/scheduling/ScheduledJob`: `{ name, intervalMs, run() }`. `AppModule.scheduledJobs?()`
  returns the module's jobs, and `Application.scheduledJobs()` collects them.
- `#infrastructure/scheduling/IntervalJobScheduler` runs each job on its interval. A job never
  overlaps with itself, a failure is logged and retried on the next tick, and `stop()` waits
  for the jobs that are running.
- `main.ts` starts the scheduler when `SCHEDULER_ENABLED=true` (default). Tests leave it off
  and call `TestApp.runJob(name)`.
- Jobs act as the system, not as a professional. Their repository queries are the only ones
  not scoped by `professionalId` (ADR-0019), and they say so in their name and documentation
  (`findDormant`, `findNeedingReminder`, `findDue`).
- Jobs must be idempotent. Each item is claimed or re-checked inside its own transaction
  (ADR-0025), so two runs never act twice on the same item.

| Job | Module | Interval | Use case |
| --- | --- | --- | --- |
| `patients.inactivate-dormant` | patients | 6 h | CU-07 automatic flow |
| `appointments.send-reminders` | appointments | 10 min | CU-14 reminders (24 h before) |
| `subscriptions.process-renewals` | subscriptions | 1 h | CU-18 step 11 |

### Consequences

- 👍 No new infrastructure, and each module keeps its own background work.
- 👍 Jobs are plain functions: tests run them directly with a fixed clock.
- 👎 With several API instances every instance runs the jobs. The items are idempotent, so the
  result is correct but the work is duplicated. Before scaling out, run the scheduler in one
  instance only (`SCHEDULER_ENABLED=false` elsewhere) or move to a distributed lock.
- 👎 A job missed while the process is down runs at the next start (it looks for everything
  that is due, not for one moment).

## Enforcement

- `apps/api/test/unit/integrations.test.ts` (scheduler: no overlap, failures logged).
- Integration tests run every job through `TestApp.runJob` (`care-automation`, `subscriptions`).

## References

- `apps/api/src/core/scheduling/ScheduledJob.ts`, `apps/api/src/infrastructure/scheduling/`
