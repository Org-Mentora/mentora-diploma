import { describe, expect, it } from 'vitest';
import { RecordAccessAdapter } from './RecordAccessAdapter';

describe('RecordAccessAdapter', () => {
  it('describes each access of the clinical record', () => {
    const [item] = RecordAccessAdapter.toItems([
      { action: 'view_consultation', consultationId: null, at: '2030-01-05T15:00:00.000Z' },
    ]);

    expect(item).toMatchObject({ actionLabel: 'Opened a consultation' });
    expect(item?.whenLabel).toContain('2030');
  });
});
