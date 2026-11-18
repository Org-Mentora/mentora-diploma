import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import {
  useChangePatientStatusMutation,
  useGetPatientQuery,
} from '@/model/api/generated/mentoraApi';
import { useAction } from '@/model/api/useAction';
import {
  PatientAdapter,
  type PatientProfile,
  type PatientStatus,
} from '@/model/domain/patients/PatientAdapter';
import { translate as t } from '@/shared/i18n';

type ManualStatus = Exclude<PatientStatus, 'inactive'>;

export interface StatusAction {
  status: ManualStatus;
  label: string;
  confirmation: string;
}

export interface PatientProfileViewModel {
  patientId: string;
  profile: PatientProfile | null;
  isLoading: boolean;
  error: UiError | null;
  isEditOpen: boolean;
  setEditOpen: (open: boolean) => void;
  statusAction: StatusAction | null;
  pendingStatus: StatusAction | null;
  isChangingStatus: boolean;
  requestStatusChange: () => void;
  cancelStatusChange: () => void;
  confirmStatusChange: () => Promise<void>;
}

function actionFor(status: PatientStatus, fullName: string): StatusAction {
  return status === 'active'
    ? {
        status: 'discharged',
        label: t('patients.action.discharge'),
        confirmation: t('patients.action.dischargeConfirm', { name: fullName }),
      }
    : {
        status: 'active',
        label: t('patients.action.reactivate'),
        confirmation: t('patients.action.reactivateConfirm', { name: fullName }),
      };
}

// ViewModel
export function usePatientProfileViewModel(): PatientProfileViewModel {
  const run = useAction();
  const { patientId = '' } = useParams();
  const { data, isLoading, error } = useGetPatientQuery({ id: patientId });
  const [changeStatus, { isLoading: isChangingStatus }] = useChangePatientStatusMutation();
  const [isEditOpen, setEditOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<StatusAction | null>(null);

  const profile = useMemo(() => (data ? PatientAdapter.toProfile(data) : null), [data]);
  const statusAction = profile ? actionFor(profile.status, profile.fullName) : null;

  return {
    patientId,
    profile,
    isLoading,
    error: ApiErrorAdapter.toUiError(error),
    isEditOpen,
    setEditOpen,
    statusAction,
    pendingStatus,
    isChangingStatus,
    requestStatusChange: () => setPendingStatus(statusAction),
    cancelStatusChange: () => setPendingStatus(null),
    confirmStatusChange: async () => {
      if (!pendingStatus) {
        return;
      }
      const request = { status: pendingStatus.status };
      await run(
        () => changeStatus({ id: patientId, changePatientStatusRequestDto: request }).unwrap(),
        {
          success: (updated) =>
            t('patients.statusChanged', { status: PatientAdapter.statusLabel(updated.status) }),
          failure: t('patients.statusFailed'),
        },
      );
      setPendingStatus(null);
    },
  };
}
