import type { ErrorResponseDto } from '@mentora/contracts';
import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { localizeServerMessage, translate as t } from '@/shared/i18n';

export interface UiError {
  code: string;
  message: string;
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

// Adapter
export class ApiErrorAdapter {
  static messageOf(error: unknown, fallback: string): string {
    return ApiErrorAdapter.toUiError(error)?.message ?? fallback;
  }

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
          message: localizeServerMessage(data.error.message),
          ...(field ? { field } : {}),
          ...(typeof status === 'number' ? { status } : {}),
        };
      }
      if (status === 'FETCH_ERROR') {
        return { code: 'NETWORK_ERROR', message: t('errors.network') };
      }
      return { code: String(status), message: t('errors.unexpected') };
    }
    const serialized = error as SerializedError;
    return {
      code: serialized.code ?? 'UNKNOWN',
      message: serialized.message ?? t('errors.unknown'),
    };
  }
}
