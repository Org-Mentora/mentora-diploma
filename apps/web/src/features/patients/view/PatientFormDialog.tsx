import { useTranslation } from '@/shared/i18n';
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
  { name: 'firstName', label: 'patients.form.firstName' },
  { name: 'lastName', label: 'patients.form.lastName' },
  { name: 'dni', label: 'patients.form.dni' },
];

const OPTIONAL: { name: FieldName; label: string; type?: string; hint?: string }[] = [
  { name: 'birthDate', label: 'patients.field.birthDate', type: 'date' },
  { name: 'gender', label: 'patients.field.gender' },
  { name: 'phone', label: 'patients.field.phone', type: 'tel' },
  { name: 'email', label: 'patients.field.email', type: 'email' },
  { name: 'address', label: 'patients.field.address' },
  { name: 'healthInsurance', label: 'patients.field.healthInsurance' },
  { name: 'memberNumber', label: 'patients.form.memberNumber' },
  { name: 'familyContactName', label: 'patients.field.familyContact' },
  { name: 'familyContactPhone', label: 'patients.form.familyContactPhone', type: 'tel' },
  { name: 'debt', label: 'patients.field.debt', type: 'number' },
  { name: 'allergies', label: 'patients.allergies', hint: 'patients.form.allergiesHint' },
];

export function PatientFormDialog({
  open,
  onOpenChange,
  patientId,
  onSaved,
}: PatientFormDialogProps) {
  const { t } = useTranslation();
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
      label={t(field.label)}
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
          <DialogTitle>
            {isEdit ? t('patients.form.editTitle') : t('patients.list.new')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('patients.form.editDescription') : t('patients.form.newDescription')}
          </DialogDescription>
        </DialogHeader>
        <form id="patient-form" className="grid gap-4 sm:grid-cols-3" noValidate onSubmit={submit}>
          {REQUIRED.map(renderField)}
          {isEdit && (
            <>
              {OPTIONAL.map(renderField)}
              <FormField
                id="observations"
                label={t('patients.form.observations')}
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
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="patient-form" disabled={isSubmitting}>
            {isSubmitting ? t('common.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
