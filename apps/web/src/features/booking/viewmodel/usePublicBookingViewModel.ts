import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import { useMemo, useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import {
  useCreateBookingRequestMutation,
  useGetAvailableSlotsQuery,
  useGetPublicBookingPageQuery,
} from '@/model/api/generated/mentoraApi';
import {
  BookingAdapter,
  type PublicPageModel,
  type SlotDay,
  type SlotOption,
} from '@/model/domain/booking/BookingAdapter';
import {
  PublicBookingForm,
  type PublicBookingFormValues,
  publicBookingSchema,
} from '@/model/domain/booking/publicBooking.form';
import { useTranslation } from '@/shared/i18n';

export type { PublicBookingFormValues, SlotDay, SlotOption };

const WEEK = 7;

export interface PublicBookingViewModel {
  isLoading: boolean;
  notFound: boolean;
  page: PublicPageModel | null;
  days: SlotDay[];
  isLoadingSlots: boolean;
  slotsError: UiError | null;
  canGoBack: boolean;
  canGoForward: boolean;
  previousWeek: () => void;
  nextWeek: () => void;
  selected: SlotOption | null;
  selectSlot: (slot: SlotOption) => void;
  clearSlot: () => void;
  form: UseFormReturn<PublicBookingFormValues>;
  isSubmitting: boolean;
  submitError: UiError | null;
  submit: () => Promise<void>;
  receipt: { when: string; modality: string } | null;
  startOver: () => void;
}

// ViewModel
export function usePublicBookingViewModel(): PublicBookingViewModel {
  const { t } = useTranslation();
  const { slug = '' } = useParams();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<SlotOption | null>(null);
  const [receipt, setReceipt] = useState<{ when: string; modality: string } | null>(null);
  const pageQuery = useGetPublicBookingPageQuery({ slug }, { skip: !slug });
  const from = format(addDays(new Date(), weekOffset * WEEK), 'yyyy-MM-dd');
  const slotsQuery = useGetAvailableSlotsQuery(
    { slug, from, days: WEEK },
    { skip: !pageQuery.data, refetchOnMountOrArgChange: true },
  );
  const [create, creating] = useCreateBookingRequestMutation();

  const page = useMemo(
    () => (pageQuery.data ? BookingAdapter.toPublicPage(pageQuery.data) : null),
    [pageQuery.data],
  );
  const days = useMemo(
    () => (slotsQuery.data ? BookingAdapter.toSlotDays(slotsQuery.data) : []),
    [slotsQuery.data],
  );
  const form = useForm<PublicBookingFormValues>({
    resolver: zodResolver(publicBookingSchema),
    defaultValues: PublicBookingForm.defaults(pageQuery.data?.modalities[0] ?? 'in_person'),
  });
  const timezone = pageQuery.data?.timezone ?? 'UTC';
  const horizonWeeks = Math.ceil((page?.horizonDays ?? WEEK) / WEEK);

  return {
    isLoading: pageQuery.isLoading,
    notFound: Boolean(pageQuery.error) || !slug,
    page,
    days,
    isLoadingSlots: slotsQuery.isFetching,
    slotsError: ApiErrorAdapter.toUiError(slotsQuery.error),
    canGoBack: weekOffset > 0,
    canGoForward: weekOffset + 1 < horizonWeeks,
    previousWeek: () => setWeekOffset((value) => Math.max(0, value - 1)),
    nextWeek: () => setWeekOffset((value) => value + 1),
    selected,
    selectSlot: (slot) => {
      setSelected(slot);
      if (pageQuery.data && !pageQuery.data.modalities.includes(form.getValues('modality'))) {
        form.setValue('modality', pageQuery.data.modalities[0] ?? 'in_person');
      }
    },
    clearSlot: () => setSelected(null),
    form,
    isSubmitting: creating.isLoading,
    submitError: ApiErrorAdapter.toUiError(creating.error),
    submit: form.handleSubmit(async (values) => {
      if (!selected) {
        return;
      }
      try {
        const created = await create({
          slug,
          createBookingRequestDto: PublicBookingForm.toRequest(values, selected.startsAt),
        }).unwrap();
        setReceipt({
          when: BookingAdapter.receipt(created.startsAt, timezone),
          modality: t(`agenda.modality.${created.modality}`),
        });
      } catch (caught) {
        const error = ApiErrorAdapter.toUiError(caught);
        if (error?.status === 409) {
          setSelected(null);
          void slotsQuery.refetch();
        }
        if (error?.field && error.field in values) {
          form.setError(error.field as keyof PublicBookingFormValues, { message: error.message });
        }
      }
    }),
    receipt,
    startOver: () => {
      setReceipt(null);
      setSelected(null);
      creating.reset();
      form.reset(PublicBookingForm.defaults(pageQuery.data?.modalities[0] ?? 'in_person'));
      void slotsQuery.refetch();
    },
  };
}
