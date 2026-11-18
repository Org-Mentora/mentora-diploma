import { ValidationError } from '#core/errors/ApplicationError';

export type CursorValue = string | number;
export type CursorKey = readonly CursorValue[];

export interface Page<T> {
  items: T[];
  next: CursorKey | null;
}

// Value Object
export class PageRequest {
  static readonly DEFAULT_LIMIT = 20;
  static readonly MAX_LIMIT = 100;

  private constructor(
    readonly limit: number,
    readonly after: CursorKey | null,
  ) {}

  static of(limit?: number, after?: CursorKey | null): PageRequest {
    const size =
      Number.isInteger(limit) && (limit ?? 0) > 0 ? (limit as number) : PageRequest.DEFAULT_LIMIT;
    return new PageRequest(Math.min(size, PageRequest.MAX_LIMIT), after ?? null);
  }

  static first(limit?: number): PageRequest {
    return PageRequest.of(limit, null);
  }

  slice<T>(sorted: readonly T[], keyOf: (item: T) => CursorKey): Page<T> {
    let start = 0;
    if (this.after) {
      const after = JSON.stringify(this.after);
      start = sorted.findIndex((item) => JSON.stringify(keyOf(item)) === after) + 1;
      if (start === 0) {
        throw new ValidationError('Invalid cursor', { field: 'cursor' });
      }
    }
    const items = sorted.slice(start, start + this.limit);
    const last = items.at(-1);
    return { items, next: sorted.length > start + this.limit && last ? keyOf(last) : null };
  }

  static map<T, U>(page: Page<T>, transform: (item: T) => U): Page<U> {
    return { items: page.items.map(transform), next: page.next };
  }
}
