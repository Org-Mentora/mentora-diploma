import type { AppLogger } from '#core/logging/AppLogger';
import type { JobLock } from '#core/scheduling/JobLock';
import type { ScheduledJob } from '#core/scheduling/ScheduledJob';

export class IntervalJobScheduler {
  readonly #timers: NodeJS.Timeout[] = [];
  readonly #running = new Map<string, Promise<void>>();

  constructor(
    private readonly logger: AppLogger,
    private readonly lock: JobLock | null = null,
    private readonly initialDelayMs = 5_000,
  ) {}

  start(jobs: readonly ScheduledJob[]): void {
    for (const job of jobs) {
      const first = setTimeout(() => void this.tick(job), this.initialDelayMs);
      const every = setInterval(() => void this.tick(job), job.intervalMs);
      first.unref();
      every.unref();
      this.#timers.push(first, every);
      this.logger.info('Scheduled job registered', { job: job.name, everyMs: job.intervalMs });
    }
  }

  async stop(): Promise<void> {
    for (const timer of this.#timers) {
      clearTimeout(timer);
    }
    this.#timers.length = 0;
    await Promise.allSettled(this.#running.values());
  }

  private async tick(job: ScheduledJob): Promise<void> {
    if (this.#running.has(job.name)) {
      return;
    }
    const startedAt = Date.now();
    const run = this.runLocked(job)
      .then(() =>
        this.logger.debug('Scheduled job done', { job: job.name, ms: Date.now() - startedAt }),
      )
      .catch((error: unknown) =>
        this.logger.error('Scheduled job failed', { job: job.name, err: error }),
      )
      .finally(() => this.#running.delete(job.name));
    this.#running.set(job.name, run);
    await run;
  }

  private async runLocked(job: ScheduledJob): Promise<void> {
    if (!this.lock) {
      await job.run();
      return;
    }
    if (!(await this.lock.acquire(job.name, job.intervalMs))) {
      this.logger.debug('Scheduled job skipped: another instance holds the lock', {
        job: job.name,
      });
      return;
    }
    try {
      await job.run();
    } finally {
      await this.lock.release(job.name);
    }
  }
}
