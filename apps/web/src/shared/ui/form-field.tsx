import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { Label } from './label';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/** Label + control + validation message, consistently spaced. */
function FormField({ id, label, error, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

export { FormField };
