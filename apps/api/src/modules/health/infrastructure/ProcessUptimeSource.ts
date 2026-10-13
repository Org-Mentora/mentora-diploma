import type { UptimeSource } from '../model/HealthService';

/** Adapter (ADR-0007): Node's `process.uptime()` as an `UptimeSource`. */
export class ProcessUptimeSource implements UptimeSource {
  uptimeSeconds(): number {
    return Math.round(process.uptime());
  }
}
