import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import {
  type UseFieldArrayReturn,
  type UseFormReturn,
  useFieldArray,
  useForm,
} from 'react-hook-form';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import { FormErrors } from '@/model/api/FormErrors';
import {
  useGetBookingSettingsQuery,
  useUpdateBookingSettingsMutation,
} from '@/model/api/generated/mentoraApi';
import {
  BookingSettingsForm,
  type BookingSettingsFormValues,
  bookingSettingsSchema,
} from '@/model/domain/booking/booking.form';
import { Formats } from '@/model/domain/format/Formats';
import { useBrowserActions, useUserFeedback } from '@/model/platform/Platform';
import { useTranslation } from '@/shared/i18n';

export type { BookingSettingsFormValues };

export interface BookingSettingsViewModel {
  isLoading: boolean;
  error: UiError | null;
  form: UseFormReturn<BookingSettingsFormValues>;
  windows: UseFieldArrayReturn<BookingSettingsFormValues, 'weeklyHours'>;
  weekdays: { value: string; label: string }[];
  publicUrl: string | null;
  timezone: string | null;
  isSaving: boolean;
  save: () => Promise<void>;
  discard: () => void;
  addWindow: () => void;
  copyLink: () => Promise<void>;
}

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

// ViewModel
export function useBookingSettingsViewModel(): BookingSettingsViewModel {
  const { t } = useTranslation();
  const feedback = useUserFeedback();
  const browser = useBrowserActions();
  const { data, isLoading, error } = useGetBookingSettingsQuery();
  const [update, { isLoading: isSaving }] = useUpdateBookingSettingsMutation();
  const form = useForm<BookingSettingsFormValues>({
    resolver: zodResolver(bookingSettingsSchema),
    defaultValues: {
      enabled: false,
      slotMinutes: '45',
      minNoticeHours: '12',
      horizonDays: '30',
      inPerson: true,
      virtual: true,
      weeklyHours: [],
      instructions: '',
    },
  });
  const windows = useFieldArray({ control: form.control, name: 'weeklyHours' });

  useEffect(() => {
    if (data) {
      form.reset(BookingSettingsForm.fromDto(data));
    }
  }, [data, form]);

  const publicUrl = data ? browser.absoluteUrl(BookingSettingsForm.publicPath(data.slug)) : null;

  return {
    isLoading,
    error: ApiErrorAdapter.toUiError(error),
    form,
    windows,
    weekdays: WEEKDAYS.map((day) => ({ value: String(day), label: Formats.weekday(day) })),
    publicUrl,
    timezone: data?.timezone ?? null,
    isSaving,
    save: form.handleSubmit(async (values) => {
      if (!values.inPerson && !values.virtual) {
        form.setError('inPerson', { message: 'booking.validation.modality' });
        return;
      }
      try {
        const saved = await update({
          updateBookingSettingsRequestDto: BookingSettingsForm.toRequest(values),
        }).unwrap();
        form.reset(BookingSettingsForm.fromDto(saved));
        feedback.success(t('booking.settings.saved'));
      } catch (caught) {
        FormErrors.apply(form, caught, { fallback: t('booking.settings.failed') });
      }
    }),
    discard: () => {
      if (data) {
        form.reset(BookingSettingsForm.fromDto(data));
      }
    },
    addWindow: () => {
      const last = form.getValues('weeklyHours').at(-1);
      const weekday = last ? String(Math.min(7, Number(last.weekday) + 1)) : '1';
      windows.append({ ...BookingSettingsForm.EMPTY_WINDOW, weekday });
    },
    copyLink: async () => {
      if (!publicUrl) {
        return;
      }
      await browser.copyText(publicUrl);
      feedback.success(t('common.copied'));
    },
  };
}
