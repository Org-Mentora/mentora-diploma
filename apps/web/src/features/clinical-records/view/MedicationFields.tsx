import { Plus, Trash2 } from 'lucide-react';
import type { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
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
  { key: 'name', label: 'Medication' },
  { key: 'dose', label: 'Dose' },
  { key: 'frequency', label: 'Frequency' },
  { key: 'duration', label: 'Duration' },
] as const;

/** CU-12: one row per prescribed medication; several can be added. */
export function MedicationFields({ form, medications, onAdd }: MedicationFieldsProps) {
  const errors = form.formState.errors.medications;

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">Medication (optional)</p>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus /> Add medication
        </Button>
      </div>
      {medications.fields.length === 0 && (
        <p className="text-muted-foreground text-sm">No medication prescribed.</p>
      )}
      {medications.fields.map((field, index) => (
        <fieldset key={field.id} className="grid gap-3 rounded-md border p-3 sm:grid-cols-4">
          <legend className="sr-only">Medication {index + 1}</legend>
          {COLUMNS.map((column) => {
            const id = `medications.${index}.${column.key}` as const;
            return (
              <FormField
                key={column.key}
                id={id}
                label={column.label}
                error={errors?.[index]?.[column.key]?.message}
              >
                <Input id={id} {...form.register(id)} />
              </FormField>
            );
          })}
          <FormField
            id={`medications.${index}.indications`}
            label="Indications"
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
              <Trash2 /> Remove
            </Button>
          </div>
        </fieldset>
      ))}
    </div>
  );
}
