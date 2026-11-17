// Command
export interface ScheduledJob {
  readonly name: string;
  readonly intervalMs: number;
  run(): Promise<void>;
}
