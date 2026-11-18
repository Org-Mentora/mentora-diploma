import { ValidationError } from '#core/errors/ApplicationError';
import { type CursorKey, type Page, PageRequest } from '#core/model/Pagination';

const MAX_PARTS = 4;

export interface PageInput {
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface PageDto<T> {
  items: T[];
  nextCursor: string | null;
}

// Adapter
export class CursorCodec {
  static encode(key: CursorKey | null): string | null {
    return key ? Buffer.from(JSON.stringify(key), 'utf8').toString('base64url') : null;
  }

  static decode(cursor: string | undefined): CursorKey | null {
    if (!cursor) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.length <= MAX_PARTS &&
        parsed.every((part) => typeof part === 'string' || typeof part === 'number')
      ) {
        return parsed;
      }
    } catch {}
    throw new ValidationError('Invalid cursor', { field: 'cursor' });
  }

  static request(input: PageInput): PageRequest {
    return PageRequest.of(input.limit, CursorCodec.decode(input.cursor));
  }

  static toDto<T, U>(page: Page<T>, transform: (item: T) => U): PageDto<U> {
    return { items: page.items.map(transform), nextCursor: CursorCodec.encode(page.next) };
  }
}
