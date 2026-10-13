import type { HealthDto } from '@mentora/contracts';
import { describe, expect, it } from 'vitest';
import { HealthAdapter } from './HealthAdapter';

const dto: HealthDto = {
  status: 'degraded',
  uptimeSeconds: 3725,
  checkedAt: '2026-01-01T00:00:00.000Z',
  components: [
    { name: 'mongodb', status: 'up', latencyMs: 4, error: null },
    { name: 'cache', status: 'down', latencyMs: null, error: 'timeout' },
  ],
};

describe('HealthAdapter', () => {
  it('maps the DTO into a display-ready UI model', () => {
    const ui = HealthAdapter.toUiModel(dto);

    expect(ui.label).toBe('Degraded performance');
    expect(ui.tone).toBe('warning');
    expect(ui.uptime).toBe('1h 2m');
    expect(ui.components).toEqual([
      { name: 'mongodb', isUp: true, detail: '4 ms' },
      { name: 'cache', isUp: false, detail: 'timeout' },
    ]);
  });

  it.each([
    [5, '5s'],
    [65, '1m 5s'],
    [7200, '2h 0m'],
  ])('formats %i seconds of uptime as %s', (seconds, expected) => {
    expect(HealthAdapter.formatUptime(seconds)).toBe(expected);
  });
});
