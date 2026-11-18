import { ArrowLeft, FileText, Pencil, Stethoscope } from 'lucide-react';
import { Link } from 'react-router';
import {
  ClinicalRecordPanel,
  DiagnosisHistoryPanel,
  RecordAccessPanel,
} from '@/features/clinical-records';
import { NotificationsPanel } from '@/features/notifications';
import { VirtualMeetingButton, VirtualMeetingsPanel } from '@/features/virtual-consultations';
import { useTranslation } from '@/shared/i18n';
import { Badge } from '@/shared/ui/badge';
import { Button, buttonVariants } from '@/shared/ui/button';
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

export function PatientProfilePage() {
  const { t } = useTranslation();
  const vm = usePatientProfileViewModel();

  if (vm.isLoading) {
    return <p className="text-muted-foreground text-sm">{t('patients.profile.loading')}</p>;
  }
  if (!vm.profile) {
    return (
      <EmptyState
        title={t('patients.profile.notFound')}
        description={vm.error?.message}
        action={
          <Link to="/patients" className="text-sm underline">
            {t('patients.profile.back')}
          </Link>
        }
      />
    );
  }

  const { profile } = vm;

  return (
    <div className="grid grid-cols-1 gap-6">
      <Link
        to="/patients"
        className="flex w-fit items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {t('nav.patients')}
      </Link>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="grid min-w-0 gap-1.5">
            <CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-1 break-words text-2xl leading-tight">
              {profile.fullName}
              <Badge variant={profile.statusTone}>{profile.statusLabel}</Badge>
            </CardTitle>
            <CardDescription>
              {profile.headline} · {profile.statusChange}
            </CardDescription>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:shrink-0 lg:justify-end [&>*]:h-auto [&>*]:min-h-10 [&>*]:whitespace-normal [&>*]:text-center sm:[&>*]:min-h-9 sm:[&>*]:whitespace-nowrap">
            <Button variant="outline" onClick={() => vm.setEditOpen(true)}>
              <Pencil /> {t('patients.profile.edit')}
            </Button>
            {vm.statusAction && (
              <Button variant="outline" onClick={vm.requestStatusChange}>
                {vm.statusAction.label}
              </Button>
            )}
            <VirtualMeetingButton patientId={vm.patientId} />
            <Link
              to={`/patients/${vm.patientId}/prescriptions/new`}
              className={buttonVariants({ variant: 'outline' })}
            >
              <FileText /> {t('patients.profile.newPrescription')}
            </Link>
            <Link
              to={`/patients/${vm.patientId}/consultations/new`}
              className={buttonVariants({ className: 'order-first col-span-2 sm:order-last' })}
            >
              <Stethoscope /> {t('patients.profile.newConsultation')}
            </Link>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="overview">{t('patients.tab.overview')}</TabsTrigger>
          <TabsTrigger value="record">{t('patients.tab.record')}</TabsTrigger>
          <TabsTrigger value="diagnoses">{t('patients.tab.diagnoses')}</TabsTrigger>
          <TabsTrigger value="meetings">{t('patients.tab.meetings')}</TabsTrigger>
          <TabsTrigger value="messages">{t('patients.tab.messages')}</TabsTrigger>
          <TabsTrigger value="access">{t('patients.tab.access')}</TabsTrigger>
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
                <p className="text-muted-foreground text-xs">{t('patients.allergies')}</p>
                <div className="flex flex-wrap gap-2">
                  {profile.allergies.length === 0 ? (
                    <span className="text-sm">{t('patients.profile.noneRecorded')}</span>
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
                  <p className="text-muted-foreground text-xs">
                    {t('patients.profile.observations')}
                  </p>
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
        <TabsContent value="meetings">
          <VirtualMeetingsPanel patientId={vm.patientId} />
        </TabsContent>
        <TabsContent value="messages">
          <NotificationsPanel patientId={vm.patientId} />
        </TabsContent>
        <TabsContent value="access">
          <RecordAccessPanel patientId={vm.patientId} />
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
            <DialogTitle>{t('patients.profile.changeStatus')}</DialogTitle>
            <DialogDescription>{vm.pendingStatus?.confirmation}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={vm.cancelStatusChange}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => void vm.confirmStatusChange()} disabled={vm.isChangingStatus}>
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
