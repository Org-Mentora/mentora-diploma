import type { ReactNode } from 'react';
import { useTranslation } from '@/shared/i18n';
import { cn } from '@/shared/lib/utils';
import { Label } from './label';

interface FormFieldProps {
  id: string;
  label?: string;
  error?: string | undefined;
  hint?: string;
  className?: string;
  children: ReactNode;
}

function FormField({ id, label, error, hint, className, children }: FormFieldProps) {
  const { t } = useTranslation();
  return (
    <div className={cn('grid gap-2', className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-destructive text-sm">
          {t(error)}
        </p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{t(hint)}</p>
      ) : null}
    </div>
  );
}

export { FormField };
