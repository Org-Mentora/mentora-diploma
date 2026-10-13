import { describe, expect, it } from 'vitest';
import { ComponentHealth } from '../../src/modules/health/model/ComponentHealth';
import { HealthReport } from '../../src/modules/health/model/HealthReport';
import { HealthService } from '../../src/modules/health/model/HealthService';
import { FixedClock, FixedUptime, StubIndicator } from '../support/fakes';

const checkedAt = new Date('2026-01-01T00:00:00.000Z');

describe('HealthReport', () => {
  it('is ok when every component is up', () => {
    const report = HealthReport.create({
      components: [ComponentHealth.up('db', 1), ComponentHealth.up('cache', 2)],
      uptimeSeconds: 10,
      checkedAt,
    });
    expect(report.status).toBe('ok');
  });

  it('is degraded when any component is down', () => {
    const report = HealthReport.create({
      components: [ComponentHealth.up('db', 1), ComponentHealth.down('cache', 'timeout')],
      uptimeSeconds: 10,
      checkedAt,
    });
    expect(report.status).toBe('degraded');
  });
});

describe('HealthService', () => {
  it('turns a throwing indicator into a down component instead of failing', async () => {
    const service = new HealthService(
      [new StubIndicator('db', 'up'), new StubIndicator('queue', 'throw')],
      new FixedClock(checkedAt),
      new FixedUptime(42),
    );

    const report = await service.getReport();

    expect(report.status).toBe('degraded');
    expect(report.uptimeSeconds).toBe(42);
    expect(report.checkedAt).toBe(checkedAt);
    expect(report.components.map((c) => [c.name, c.status, c.error])).toEqual([
      ['db', 'up', null],
      ['queue', 'down', 'queue unreachable'],
    ]);
  });
});
