import type { UptimeSource } from '../model/HealthService';

// Adapter
export class ProcessUptimeSource implements UptimeSource {
  uptimeSeconds(): number {
    return Math.round(process.uptime());
  }
}
