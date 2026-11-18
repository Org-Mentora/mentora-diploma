import { describe, expect, it } from 'vitest';
import { ValidationError } from '#core/errors/ApplicationError';
import { PageRequest } from '#core/model/Pagination';
import { CursorCodec } from '#core/presenter/CursorCodec';
import { Keyset } from '#infrastructure/database/Keyset';

describe('Cursor pagination (ADR-0048)', () => {
  it('defaults to 20 items and caps the page size at 100', () => {
    expect(PageRequest.first().limit).toBe(20);
    expect(PageRequest.of(500).limit).toBe(100);
    expect(PageRequest.of(0).limit).toBe(20);
  });

  it('round-trips an opaque cursor and rejects tampered ones', () => {
    const cursor = CursorCodec.encode(['2030-01-01T00:00:00.000Z', 'id-1']);
    expect(CursorCodec.decode(cursor ?? undefined)).toEqual(['2030-01-01T00:00:00.000Z', 'id-1']);
    expect(CursorCodec.encode(null)).toBeNull();
    expect(() => CursorCodec.decode('garbage')).toThrow(ValidationError);
    expect(() => CursorCodec.decode(CursorCodec.encode([{} as never]) ?? '')).toThrow(
      ValidationError,
    );
  });

  it('builds a keyset filter that resumes after the last key, honouring each direction', () => {
    const keyset = new Keyset([
      { path: 'createdAt', direction: -1, type: 'date' },
      { path: '_id', direction: -1 },
    ]);
    const at = '2030-01-01T00:00:00.000Z';

    expect(keyset.sort()).toEqual({ createdAt: -1, _id: -1 });
    expect(keyset.where({ professionalId: 'p' }, null)).toEqual({ professionalId: 'p' });
    expect(keyset.where({ professionalId: 'p' }, [at, 'b'])).toEqual({
      $and: [
        { professionalId: 'p' },
        {
          $or: [
            { createdAt: { $lt: new Date(at) } },
            { createdAt: new Date(at), _id: { $lt: 'b' } },
          ],
        },
      ],
    });
    expect(() => keyset.where({}, ['not-a-date', 'b'])).toThrow(ValidationError);
    expect(() => keyset.where({}, [at])).toThrow(ValidationError);
  });

  it('asks for one extra record to know whether there is a next page', () => {
    const keyset = new Keyset([{ path: '_id', direction: 1 }]);
    const request = PageRequest.of(2);

    const full = keyset.page([{ _id: 'a' }, { _id: 'b' }, { _id: 'c' }], request, (r) => r._id);
    const last = keyset.page([{ _id: 'd' }], request, (r) => r._id);

    expect(full).toEqual({ items: ['a', 'b'], next: ['b'] });
    expect(last).toEqual({ items: ['d'], next: null });
  });

  it('slices an in-memory, append-only collection by key', () => {
    const items = ['e', 'd', 'c', 'b', 'a'];
    const first = PageRequest.of(2).slice(items, (x) => [x]);
    const second = PageRequest.of(2, first.next).slice(items, (x) => [x]);

    expect(first).toEqual({ items: ['e', 'd'], next: ['d'] });
    expect(second).toEqual({ items: ['c', 'b'], next: ['b'] });
    expect(() => PageRequest.of(2, ['zz']).slice(items, (x) => [x])).toThrow(ValidationError);
  });
});
