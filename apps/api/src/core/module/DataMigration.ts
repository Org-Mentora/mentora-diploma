// Command
export interface DataMigration {
  readonly name: string;
  run(): Promise<unknown>;
}
