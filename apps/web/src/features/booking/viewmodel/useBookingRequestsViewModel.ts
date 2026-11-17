import { useMemo, useState } from 'react';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import {
  useAcceptBookingRequestMutation,
  useGetBookingSettingsQuery,
  useListBookingRequestsQuery,
  useRejectBookingRequestMutation,
} from '@/model/api/generated/mentoraApi';
import {
  APPOINTMENT_TYPES,
  type AppointmentType,
  typeLabel,
} from '@/model/domain/appointments/AgendaAdapter';
import { BookingAdapter, type BookingRequestItem } from '@/model/domain/booking/BookingAdapter';
import { useUserFeedback } from '@/model/platform/Platform';
import { useTranslation } from '@/shared/i18n';

export type { BookingRequestItem };

export type BookingDecision =
  | { kind: 'accept'; item: BookingRequestItem; type: AppointmentType; notes: string }
  | { kind: 'reject'; item: BookingRequestItem; reason: string };

export interface BookingRequestsViewModel {
  isEnabled: boolean;
  isLoading: boolean;
  error: UiError | null;
  pending: BookingRequestItem[];
  showHistory: boolean;
  toggleHistory: () => void;
  history: BookingRequestItem[];
  typeOptions: { value: AppointmentType; label: string }[];
  decision: BookingDecision | null;
  startAccept: (item: BookingRequestItem) => void;
  startReject: (item: BookingRequestItem) => void;
  setType: (type: string) => void;
  setNotes: (notes: string) => void;
  setReason: (reason: string) => void;
  cancelDecision: () => void;
  isDeciding: boolean;
  decisionError: string | null;
  confirmDecision: () => Promise<void>;
}

// ViewModel
export function useBookingRequestsViewModel(): BookingRequestsViewModel {
  const { t } = useTranslation();
  const feedback = useUserFeedback();
  const settings = useGetBookingSettingsQuery();
  const [showHistory, setShowHistory] = useState(false);
  const pendingQuery = useListBookingRequestsQuery(
    { status: 'pending' },
    { pollingInterval: 60_000, refetchOnMountOrArgChange: true },
  );
  const historyQuery = useListBookingRequestsQuery({}, { skip: !showHistory });
  const [accept, accepting] = useAcceptBookingRequestMutation();
  const [reject, rejecting] = useRejectBookingRequestMutation();
  const [decision, setDecision] = useState<BookingDecision | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const timezone = settings.data?.timezone;

  const pending = useMemo(
    () => (pendingQuery.data ?? []).map((dto) => BookingAdapter.toRequestItem(dto, timezone)),
    [pendingQuery.data, timezone],
  );
  const history = useMemo(
    () =>
      (historyQuery.data ?? [])
        .filter((dto) => dto.status !== 'pending')
        .map((dto) => BookingAdapter.toRequestItem(dto, timezone)),
    [historyQuery.data, timezone],
  );

  const open = (next: BookingDecision) => {
    setDecisionError(null);
    setDecision(next);
  };

  return {
    isEnabled: settings.data?.enabled ?? false,
    isLoading: pendingQuery.isLoading,
    error: ApiErrorAdapter.toUiError(pendingQuery.error),
    pending,
    showHistory,
    toggleHistory: () => setShowHistory((value) => !value),
    history,
    typeOptions: APPOINTMENT_TYPES.map((value) => ({ value, label: typeLabel(value) })),
    decision,
    startAccept: (item) =>
      open({
        kind: 'accept',
        item,
        type: item.isNewPatient ? 'first_visit' : 'control',
        notes: item.reason ?? '',
      }),
    startReject: (item) => open({ kind: 'reject', item, reason: '' }),
    setType: (type) =>
      setDecision((current) =>
        current?.kind === 'accept'
          ? { ...current, type: APPOINTMENT_TYPES.find((value) => value === type) ?? current.type }
          : current,
      ),
    setNotes: (notes) =>
      setDecision((current) => (current?.kind === 'accept' ? { ...current, notes } : current)),
    setReason: (reason) =>
      setDecision((current) => (current?.kind === 'reject' ? { ...current, reason } : current)),
    cancelDecision: () => setDecision(null),
    isDeciding: accepting.isLoading || rejecting.isLoading,
    decisionError,
    confirmDecision: async () => {
      if (!decision) {
        return;
      }
      try {
        if (decision.kind === 'accept') {
          await accept({
            id: decision.item.id,
            acceptBookingRequestDto: {
              type: decision.type,
              notes: decision.notes.trim() || null,
            },
          }).unwrap();
          feedback.success(t('booking.requests.accepted', { name: decision.item.requesterName }));
        } else {
          await reject({
            id: decision.item.id,
            rejectBookingRequestDto: { reason: decision.reason.trim() || null },
          }).unwrap();
          feedback.success(t('booking.requests.rejected', { name: decision.item.requesterName }));
        }
        setDecision(null);
      } catch (caught) {
        setDecisionError(
          ApiErrorAdapter.toUiError(caught)?.message ?? t('booking.requests.decisionFailed'),
        );
      }
    },
  };
}
