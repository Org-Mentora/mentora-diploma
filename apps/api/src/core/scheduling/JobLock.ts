export abstract class JobLock {
  abstract acquire(job: string, leaseMs: number): Promise<boolean>;
  abstract release(job: string): Promise<void>;
}
