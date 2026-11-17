import { Plus, Trash2 } from 'lucide-react';
import type { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import type { ConsultationFormValues } from '../viewmodel/useNewConsultationViewModel';

interface MedicationFieldsProps {
  form: UseFormReturn<ConsultationFormValues>;
  medications: UseFieldArrayReturn<ConsultationFormValues, 'medications'>;
  onAdd: () => void;
}

const COLUMNS = [
  { key: 'name', label: 'clinical.medication.name' },
  { key: 'dose', label: 'clinical.medication.dose' },
  { key: 'frequency', label: 'clinical.medication.frequency' },
  { key: 'duration', label: 'clinical.medication.duration' },
] as const;

export function MedicationFields({ form, medications, onAdd }: MedicationFieldsProps) {
  const { t } = useTranslation();
  const errors = form.formState.errors.medications;

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">{t('clinical.medication.optional')}</p>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus /> {t('clinical.medication.add')}
        </Button>
      </div>
      {medications.fields.length === 0 && (
        <p className="text-muted-foreground text-sm">{t('clinical.medication.none')}</p>
      )}
      {medications.fields.map((field, index) => (
        <fieldset key={field.id} className="grid gap-3 rounded-md border p-3 sm:grid-cols-4">
          <legend className="sr-only">
            {t('clinical.medication.legend', { index: index + 1 })}
          </legend>
          {COLUMNS.map((column) => {
            const id = `medications.${index}.${column.key}` as const;
            return (
              <FormField
                key={column.key}
                id={id}
                label={t(column.label)}
                error={errors?.[index]?.[column.key]?.message}
              >
                <Input id={id} {...form.register(id)} />
              </FormField>
            );
          })}
          <FormField
            id={`medications.${index}.indications`}
            label={t('clinical.medication.indications')}
            className="sm:col-span-3"
          >
            <Input
              id={`medications.${index}.indications`}
              {...form.register(`medications.${index}.indications`)}
            />
          </FormField>
          <div className="flex items-end justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => medications.remove(index)}
            >
              <Trash2 /> {t('clinical.medication.remove')}
            </Button>
          </div>
        </fieldset>
      ))}
    </div>
  );
}
