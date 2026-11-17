import { Plus, Search } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { Input } from '@/shared/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { usePatientListViewModel } from '../viewmodel/usePatientListViewModel';
import { PatientFormDialog } from './PatientFormDialog';

export function PatientListPage() {
  const { t } = useTranslation();
  const vm = usePatientListViewModel();

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-xl">{t('nav.patients')}</CardTitle>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              aria-label={t('patients.list.search')}
              placeholder={t('patients.list.searchPlaceholder')}
              className="pl-8"
              value={vm.query}
              onChange={(event) => vm.setQuery(event.target.value)}
            />
          </div>
          <Button onClick={() => vm.setCreateOpen(true)}>
            <Plus />
            {t('patients.list.new')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {vm.error && (
          <p role="alert" className="mb-4 text-destructive text-sm">
            {vm.error.message}
          </p>
        )}
        {vm.isLoading ? (
          <p className="text-muted-foreground text-sm">{t('patients.list.loading')}</p>
        ) : vm.patients.length === 0 ? (
          <EmptyState title={vm.emptyMessage} />
        ) : (
          <Table aria-busy={vm.isSearching}>
            <TableHeader>
              <TableRow>
                <TableHead>{t('patients.list.name')}</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>{t('patients.list.age')}</TableHead>
                <TableHead>{t('patients.field.phone')}</TableHead>
                <TableHead>{t('patients.field.healthInsurance')}</TableHead>
                <TableHead>{t('patients.list.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vm.patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    <button
                      type="button"
                      className="hover:underline"
                      onClick={() => vm.openPatient(patient.id)}
                    >
                      {patient.fullName}
                    </button>
                  </TableCell>
                  <TableCell>{patient.dni}</TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>{patient.healthInsurance}</TableCell>
                  <TableCell>
                    <Badge variant={patient.statusTone}>{patient.statusLabel}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <PatientFormDialog
        open={vm.isCreateOpen}
        onOpenChange={vm.setCreateOpen}
        onSaved={vm.openPatient}
      />
    </Card>
  );
}
