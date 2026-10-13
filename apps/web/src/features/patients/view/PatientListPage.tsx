import { Plus, Search } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { Input } from '@/shared/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { usePatientListViewModel } from '../viewmodel/usePatientListViewModel';
import { PatientFormDialog } from './PatientFormDialog';

/** CU-05 Search patients. */
export function PatientListPage() {
  const vm = usePatientListViewModel();

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-xl">Patients</CardTitle>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              aria-label="Search patients"
              placeholder="Search by name, surname or DNI"
              className="pl-8"
              value={vm.query}
              onChange={(event) => vm.setQuery(event.target.value)}
            />
          </div>
          <Button onClick={() => vm.setCreateOpen(true)}>
            <Plus />
            New patient
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
          <p className="text-muted-foreground text-sm">Loading patients…</p>
        ) : vm.patients.length === 0 ? (
          <EmptyState title={vm.emptyMessage} />
        ) : (
          <Table aria-busy={vm.isSearching}>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Health insurance</TableHead>
                <TableHead>Status</TableHead>
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
