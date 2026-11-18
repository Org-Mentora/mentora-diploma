import { ValidationError } from '#core/errors/ApplicationError';
import type { CursorKey, CursorValue, Page, PageRequest } from '#core/model/Pagination';

export interface KeysetField {
  path: string;
  direction: 1 | -1;
  type?: 'string' | 'number' | 'date';
}

type Filter = Record<string, unknown>;

function invalid(): never {
  throw new ValidationError('Invalid cursor', { field: 'cursor' });
}

// Strategy
export class Keyset {
  constructor(private readonly fields: readonly KeysetField[]) {}

  sort(): Record<string, 1 | -1> {
    return Object.fromEntries(this.fields.map((field) => [field.path, field.direction]));
  }

  where(base: Filter, after: CursorKey | null): Filter {
    if (!after) {
      return base;
    }
    if (after.length !== this.fields.length) {
      invalid();
    }
    const values = this.fields.map((field, index) => this.decode(field, after[index]));
    const branches = this.fields.map((field, index) => {
      const branch: Filter = {};
      for (let previous = 0; previous < index; previous += 1) {
        branch[this.fields[previous]?.path ?? ''] = values[previous];
      }
      branch[field.path] = { [field.direction === 1 ? '$gt' : '$lt']: values[index] };
      return branch;
    });
    return Object.keys(base).length === 0 ? { $or: branches } : { $and: [base, { $or: branches }] };
  }

  slice<TRecord>(
    records: TRecord[],
    request: PageRequest,
  ): { records: TRecord[]; next: CursorKey | null } {
    const hasMore = records.length > request.limit;
    const kept = hasMore ? records.slice(0, request.limit) : records;
    const last = kept.at(-1);
    return { records: kept, next: hasMore && last ? this.keyOf(last) : null };
  }

  page<TRecord, TItem>(
    records: TRecord[],
    request: PageRequest,
    toItem: (record: TRecord) => TItem,
  ): Page<TItem> {
    const { records: kept, next } = this.slice(records, request);
    return { items: kept.map(toItem), next };
  }

  private keyOf(record: unknown): CursorKey {
    return this.fields.map((field) => {
      const value = field.path
        .split('.')
        .reduce<unknown>(
          (current, part) => (current as Record<string, unknown> | null)?.[part],
          record,
        );
      if (value instanceof Date) {
        return value.toISOString();
      }
      return typeof value === 'number' ? value : String(value ?? '');
    });
  }

  private decode(field: KeysetField, value: CursorValue | undefined): unknown {
    switch (field.type ?? 'string') {
      case 'date': {
        const date = typeof value === 'string' ? new Date(value) : null;
        return date && !Number.isNaN(date.getTime()) ? date : invalid();
      }
      case 'number':
        return typeof value === 'number' ? value : invalid();
      default:
        return typeof value === 'string' ? value : invalid();
    }
  }
}
