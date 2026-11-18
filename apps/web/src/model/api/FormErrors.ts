import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { ApiErrorAdapter } from './ApiErrorAdapter';

export interface FormErrorOptions<TValues extends FieldValues> {
  fallback: string;
  fields?: readonly Path<TValues>[];
}

// Adapter
export class FormErrors {
  static apply<TValues extends FieldValues>(
    form: UseFormReturn<TValues>,
    caught: unknown,
    { fallback, fields = [] }: FormErrorOptions<TValues>,
  ): void {
    const error = ApiErrorAdapter.toUiError(caught);
    const field = fields.find((name) => name === error?.field);
    form.setError(field ?? 'root', { message: error?.message ?? fallback });
  }
}
