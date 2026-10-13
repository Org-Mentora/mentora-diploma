import { ArrowLeft, Pencil, Stethoscope } from 'lucide-react';
import { Link } from 'react-router';
import { ClinicalRecordPanel, DiagnosisHistoryPanel } from '@/features/clinical-records';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { EmptyState } from '@/shared/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { usePatientProfileViewModel } from '../viewmodel/usePatientProfileViewModel';
import { PatientFormDialog } from './PatientFormDialog';

/** Patient profile: data (CU-06), status (CU-07), clinical record (CU-08) and diagnoses (CU-11). */
export function PatientProfilePage() {
  const vm = usePatientProfileViewModel();

  if (vm.isLoading) {
    return <p className="text-muted-foreground text-sm">Loading patient…</p>;
  }
  if (!vm.profile) {
    return (
      <EmptyState
        title="Patient not found"
        description={vm.error?.message}
        action={
          <Link to="/patients" className="text-sm underline">
            Back to patients
          </Link>
        }
      />
    );
  }

  const { profile } = vm;

  return (
    <div className="grid gap-6">
      <Link
        to="/patients"
        className="flex w-fit items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Patients
      </Link>

      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1.5">
            <CardTitle className="flex items-center gap-3 text-2xl">
              {profile.fullName}
              <Badge variant={profile.statusTone}>{profile.statusLabel}</Badge>
            </CardTitle>
            <CardDescription>
              {profile.headline} · {profile.statusChange}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => vm.setEditOpen(true)}>
              <Pencil /> Edit data
            </Button>
            {vm.statusAction && (
              <Button variant="outline" onClick={vm.requestStatusChange}>
                {vm.statusAction.label}
              </Button>
            )}
            <Link
              to={`/patients/${vm.patientId}/consultations/new`}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 font-medium text-primary-foreground text-sm hover:bg-primary/90"
            >
              <Stethoscope className="size-4" /> New consultation
            </Link>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="record">Clinical record</TabsTrigger>
          <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardContent className="grid gap-6">
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {profile.details.map((detail) => (
                  <div key={detail.label}>
                    <dt className="text-muted-foreground text-xs">{detail.label}</dt>
                    <dd className="text-sm">{detail.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="grid gap-2">
                <p className="text-muted-foreground text-xs">Allergies</p>
                <div className="flex flex-wrap gap-2">
                  {profile.allergies.length === 0 ? (
                    <span className="text-sm">None recorded</span>
                  ) : (
                    profile.allergies.map((allergy) => (
                      <Badge key={allergy} variant="danger">
                        {allergy}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              {profile.observations && (
                <div className="grid gap-2">
                  <p className="text-muted-foreground text-xs">Observations</p>
                  <p className="whitespace-pre-wrap text-sm">{profile.observations}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="record">
          <ClinicalRecordPanel patientId={vm.patientId} />
        </TabsContent>
        <TabsContent value="diagnoses">
          <DiagnosisHistoryPanel patientId={vm.patientId} />
        </TabsContent>
      </Tabs>

      <PatientFormDialog
        open={vm.isEditOpen}
        onOpenChange={vm.setEditOpen}
        patientId={vm.patientId}
      />

      <Dialog
        open={vm.pendingStatus !== null}
        onOpenChange={(open) => !open && vm.cancelStatusChange()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change patient status</DialogTitle>
            <DialogDescription>{vm.pendingStatus?.confirmation}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={vm.cancelStatusChange}>
              Cancel
            </Button>
            <Button onClick={() => void vm.confirmStatusChange()} disabled={vm.isChangingStatus}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
