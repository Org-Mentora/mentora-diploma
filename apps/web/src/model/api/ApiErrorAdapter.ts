import type { ErrorResponseDto } from '@mentora/contracts';
import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export interface UiError {
  code: string;
  message: string;
  /** Form field the API blamed (e.g. `dni` on a duplicated patient), when known. */
  field?: string;
  status?: number;
}

function isErrorResponse(data: unknown): data is ErrorResponseDto {
  return typeof data === 'object' && data !== null && 'error' in data;
}

function fieldOf(details: unknown): string | undefined {
  if (typeof details === 'object' && details !== null && 'field' in details) {
    const { field } = details as { field: unknown };
    return typeof field === 'string' ? field : undefined;
  }
  return undefined;
}

/**
 * Adapter (ADR-0007): turns the different RTK Query error shapes (including what
 * `.unwrap()` throws) into one `UiError` that ViewModels can expose.
 */
export class ApiErrorAdapter {
  static toUiError(error: unknown): UiError | null {
    if (!error || typeof error !== 'object') {
      return null;
    }
    if ('status' in error) {
      const { status, data } = error as FetchBaseQueryError;
      if (isErrorResponse(data)) {
        const field = fieldOf(data.error.details);
        return {
          code: data.error.code,
          message: data.error.message,
          ...(field ? { field } : {}),
          ...(typeof status === 'number' ? { status } : {}),
        };
      }
      if (status === 'FETCH_ERROR') {
        return { code: 'NETWORK_ERROR', message: 'The server could not be reached' };
      }
      return { code: String(status), message: 'Unexpected response from the server' };
    }
    const serialized = error as SerializedError;
    return {
      code: serialized.code ?? 'UNKNOWN',
      message: serialized.message ?? 'Unknown error',
    };
  }
}
