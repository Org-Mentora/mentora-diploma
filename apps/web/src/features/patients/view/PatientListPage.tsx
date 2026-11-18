import { Plus, Search } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { Input } from '@/shared/ui/input';
import { LoadMore } from '@/shared/ui/load-more';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { usePatientListViewModel } from '../viewmodel/usePatientListViewModel';
import { PatientFormDialog } from './PatientFormDialog';

export function PatientListPage() {
  const { t } = useTranslation();
  const vm = usePatientListViewModel();

  return (
    <Card>
      <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap">
        <CardTitle className="text-xl">{t('nav.patients')}</CardTitle>
        <div className="relative order-last col-span-2 sm:order-none sm:col-span-1 sm:ml-auto sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label={t('patients.list.search')}
            placeholder={t('patients.list.searchPlaceholder')}
            className="pl-8"
            value={vm.query}
            onChange={(event) => vm.setQuery(event.target.value)}
          />
        </div>
        <Button className="shrink-0" onClick={() => vm.setCreateOpen(true)}>
          <Plus />
          {t('patients.list.new')}
        </Button>
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
                <TableHead className="hidden sm:table-cell">DNI</TableHead>
                <TableHead className="hidden md:table-cell">{t('patients.list.age')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('patients.field.phone')}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {t('patients.field.healthInsurance')}
                </TableHead>
                <TableHead className="text-right sm:text-left">
                  {t('patients.list.status')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vm.patients.map((patient) => (
                <TableRow
                  key={patient.id}
                  className="cursor-pointer"
                  onClick={() => vm.openPatient(patient.id)}
                >
                  <TableCell className="whitespace-normal py-3 font-medium sm:whitespace-nowrap">
                    <button
                      type="button"
                      className="text-left underline-offset-2 hover:underline"
                      onClick={(event) => {
                        event.stopPropagation();
                        vm.openPatient(patient.id);
                      }}
                    >
                      {patient.fullName}
                    </button>
                    <span className="block font-normal text-muted-foreground text-xs sm:hidden">
                      DNI {patient.dni}
                    </span>
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{patient.dni}</TableCell>
                  <TableCell className="hidden md:table-cell">{patient.age}</TableCell>
                  <TableCell className="hidden tabular-nums lg:table-cell">
                    {patient.phone}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{patient.healthInsurance}</TableCell>
                  <TableCell className="text-right sm:text-left">
                    <Badge variant={patient.statusTone}>{patient.statusLabel}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <LoadMore hasMore={vm.hasMore} isLoading={vm.isLoadingMore} onLoadMore={vm.loadMore} />
      </CardContent>
      <PatientFormDialog
        open={vm.isCreateOpen}
        onOpenChange={vm.setCreateOpen}
        onSaved={vm.openPatient}
      />
    </Card>
  );
}
