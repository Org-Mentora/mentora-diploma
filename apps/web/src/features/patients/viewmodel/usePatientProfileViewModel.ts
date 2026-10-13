import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import {
  useChangePatientStatusMutation,
  useGetPatientQuery,
} from '@/model/api/generated/mentoraApi';
import {
  PatientAdapter,
  type PatientProfile,
  type PatientStatus,
} from '@/model/domain/patients/PatientAdapter';

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

/** CU-07 manual transitions available from each status. */
function actionFor(status: PatientStatus, fullName: string): StatusAction {
  return status === 'active'
    ? {
        status: 'discharged',
        label: 'Discharge',
        confirmation: `Discharge ${fullName}? You can reactivate the patient later.`,
      }
    : {
        status: 'active',
        label: 'Reactivate',
        confirmation: `Mark ${fullName} as active again?`,
      };
}

/** Patient profile: overview, CU-06 edit dialog and CU-07 status management. */
export function usePatientProfileViewModel(): PatientProfileViewModel {
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
    // CU-07 step 4: ask for confirmation before changing the status.
    requestStatusChange: () => setPendingStatus(statusAction),
    cancelStatusChange: () => setPendingStatus(null),
    confirmStatusChange: async () => {
      if (!pendingStatus) {
        return;
      }
      try {
        const updated = await changeStatus({
          id: patientId,
          changePatientStatusRequestDto: { status: pendingStatus.status },
        }).unwrap();
        toast.success(`Status changed to ${PatientAdapter.statusLabel(updated.status)}`);
      } catch (caught) {
        toast.error(ApiErrorAdapter.toUiError(caught)?.message ?? 'Could not change the status');
      } finally {
        setPendingStatus(null);
      }
    },
  };
}
