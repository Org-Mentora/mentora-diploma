import type { ErrorResponseDto } from '@mentora/contracts';
import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export interface UiError {
  code: string;
  message: string;
}

function isErrorResponse(data: unknown): data is ErrorResponseDto {
  return typeof data === 'object' && data !== null && 'error' in data;
}

/**
 * Adapter (ADR-0007): turns the different RTK Query error shapes into one `UiError`
 * that ViewModels can expose without knowing about transport details.
 */
export class ApiErrorAdapter {
  static toUiError(error: FetchBaseQueryError | SerializedError | undefined): UiError | null {
    if (!error) {
      return null;
    }
    if ('status' in error) {
      if (isErrorResponse(error.data)) {
        return { code: error.data.error.code, message: error.data.error.message };
      }
      if (error.status === 'FETCH_ERROR') {
        return { code: 'NETWORK_ERROR', message: 'The server could not be reached' };
      }
      return { code: String(error.status), message: 'Unexpected response from the server' };
    }
    return { code: error.code ?? 'UNKNOWN', message: error.message ?? 'Unknown error' };
  }
}
