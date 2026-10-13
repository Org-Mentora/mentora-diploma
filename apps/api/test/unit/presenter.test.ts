import { describe, expect, it } from 'vitest';
import { NotFoundError } from '#core/errors/ApplicationError';
import { Presenter } from '#core/presenter/Presenter';
import type { HealthDto } from '../../src/modules/health/contracts/health.contracts';
import { HealthService } from '../../src/modules/health/model/HealthService';
import { GetHealthPresenter } from '../../src/modules/health/presenter/GetHealthPresenter';
import { FixedClock, FixedUptime, SpyView, StubIndicator } from '../support/fakes';

class FailingPresenter extends Presenter<void, string> {
  constructor(
    view: SpyView<string>,
    private readonly error: Error,
  ) {
    super(view);
  }

  protected async execute(): Promise<string> {
    throw this.error;
  }
}

describe('Presenter base class', () => {
  it('renders known application errors through the view', async () => {
    const view = new SpyView<string>();
    await new FailingPresenter(view, new NotFoundError('Mentor', '42')).present();

    expect(view.rendered).toBeUndefined();
    expect(view.error).toMatchObject({ kind: 'not_found', code: 'NOT_FOUND' });
  });

  it('re-throws unexpected errors so the HTTP layer answers 500', async () => {
    const view = new SpyView<string>();
    const presenter = new FailingPresenter(view, new TypeError('boom'));

    await expect(presenter.present()).rejects.toThrow('boom');
    expect(view.error).toBeUndefined();
  });
});

describe('GetHealthPresenter', () => {
  it('maps the HealthReport into a HealthDto view model', async () => {
    const view = new SpyView<HealthDto>();
    const service = new HealthService(
      [new StubIndicator('mongodb', 'up')],
      new FixedClock(new Date('2026-01-01T00:00:00.000Z')),
      new FixedUptime(7),
    );

    await new GetHealthPresenter(view, service).present();

    expect(view.rendered).toEqual({
      status: 'ok',
      uptimeSeconds: 7,
      checkedAt: '2026-01-01T00:00:00.000Z',
      components: [{ name: 'mongodb', status: 'up', latencyMs: 5, error: null }],
    });
  });
});
