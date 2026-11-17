import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { useChangePasswordViewModel } from '../viewmodel/useChangePasswordViewModel';

export function ChangePasswordPage() {
  const vm = useChangePasswordViewModel();
  const { errors } = vm.form.formState;

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Enter your current password and choose a new one.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" noValidate onSubmit={vm.save}>
          <FormField
            id="currentPassword"
            label="Current password"
            error={errors.currentPassword?.message}
          >
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...vm.form.register('currentPassword')}
            />
          </FormField>
          <FormField
            id="newPassword"
            label="New password"
            hint={vm.passwordHint}
            error={errors.newPassword?.message}
          >
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...vm.form.register('newPassword')}
            />
          </FormField>
          <FormField
            id="confirmPassword"
            label="Repeat the new password"
            error={errors.confirmPassword?.message}
          >
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...vm.form.register('confirmPassword')}
            />
          </FormField>
          {errors.root && (
            <p role="alert" className="text-destructive text-sm">
              {errors.root.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={vm.discard}>
              Cancel
            </Button>
            <Button type="submit" disabled={vm.isSaving}>
              Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
