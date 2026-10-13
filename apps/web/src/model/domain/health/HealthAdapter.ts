import type { ComponentHealthDto, HealthDto } from '@mentora/contracts';

export type HealthTone = 'success' | 'warning' | 'danger';

export interface ComponentHealthUiModel {
  name: string;
  isUp: boolean;
  detail: string;
}

export interface HealthUiModel {
  label: string;
  tone: HealthTone;
  uptime: string;
  checkedAt: string;
  components: ComponentHealthUiModel[];
}

/**
 * Adapter (ADR-0007): maps the `HealthDto` contract to a UI model with display-ready values,
 * so ViewModels and Views never format raw DTO fields themselves.
 */
export class HealthAdapter {
  static toUiModel(dto: HealthDto): HealthUiModel {
    return {
      label: dto.status === 'ok' ? 'All systems operational' : 'Degraded performance',
      tone: dto.status === 'ok' ? 'success' : 'warning',
      uptime: HealthAdapter.formatUptime(dto.uptimeSeconds),
      checkedAt: new Date(dto.checkedAt).toLocaleTimeString(),
      components: dto.components.map(HealthAdapter.toComponent),
    };
  }

  static formatUptime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  }

  private static toComponent(dto: ComponentHealthDto): ComponentHealthUiModel {
    return {
      name: dto.name,
      isUp: dto.status === 'up',
      detail: dto.status === 'up' ? `${dto.latencyMs ?? 0} ms` : (dto.error ?? 'unavailable'),
    };
  }
}
