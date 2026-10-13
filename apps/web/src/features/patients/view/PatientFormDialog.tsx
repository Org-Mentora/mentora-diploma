import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { usePatientFormViewModel } from '../viewmodel/usePatientFormViewModel';

interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId?: string;
  onSaved?: (patientId: string) => void;
}

type FieldName =
  | 'firstName'
  | 'lastName'
  | 'dni'
  | 'birthDate'
  | 'gender'
  | 'phone'
  | 'email'
  | 'address'
  | 'healthInsurance'
  | 'memberNumber'
  | 'familyContactName'
  | 'familyContactPhone'
  | 'debt'
  | 'allergies';

const REQUIRED: { name: FieldName; label: string }[] = [
  { name: 'firstName', label: 'First name *' },
  { name: 'lastName', label: 'Last name *' },
  { name: 'dni', label: 'DNI *' },
];

const OPTIONAL: { name: FieldName; label: string; type?: string; hint?: string }[] = [
  { name: 'birthDate', label: 'Birth date', type: 'date' },
  { name: 'gender', label: 'Gender' },
  { name: 'phone', label: 'Phone', type: 'tel' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'address', label: 'Address' },
  { name: 'healthInsurance', label: 'Health insurance' },
  { name: 'memberNumber', label: 'Member number' },
  { name: 'familyContactName', label: 'Family contact' },
  { name: 'familyContactPhone', label: 'Family contact phone', type: 'tel' },
  { name: 'debt', label: 'Debt', type: 'number' },
  { name: 'allergies', label: 'Allergies', hint: 'Separate with commas' },
];

/** CU-04 (create) and CU-06 (edit) form. */
export function PatientFormDialog({
  open,
  onOpenChange,
  patientId,
  onSaved,
}: PatientFormDialogProps) {
  const { form, isEdit, isSubmitting, error, submit } = usePatientFormViewModel({
    patientId,
    onSaved: (id) => {
      onOpenChange(false);
      onSaved?.(id);
    },
  });
  const { errors } = form.formState;

  const renderField = (field: { name: FieldName; label: string; type?: string; hint?: string }) => (
    <FormField
      key={field.name}
      id={field.name}
      label={field.label}
      error={errors[field.name]?.message}
      {...(field.hint ? { hint: field.hint } : {})}
    >
      <Input
        id={field.name}
        type={field.type ?? 'text'}
        aria-invalid={!!errors[field.name]}
        {...form.register(field.name)}
      />
    </FormField>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit patient' : 'New patient'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update personal, contact, administrative and clinical data.'
              : 'Only first name, last name and DNI are required.'}
          </DialogDescription>
        </DialogHeader>
        <form id="patient-form" className="grid gap-4 sm:grid-cols-3" noValidate onSubmit={submit}>
          {REQUIRED.map(renderField)}
          {isEdit && (
            <>
              {OPTIONAL.map(renderField)}
              <FormField
                id="observations"
                label="General observations"
                className="sm:col-span-3"
                error={errors.observations?.message}
              >
                <Textarea id="observations" {...form.register('observations')} />
              </FormField>
            </>
          )}
        </form>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error.message}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="patient-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
