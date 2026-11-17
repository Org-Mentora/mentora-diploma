import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import {
  useGetCurrentProfessionalQuery,
  useGetLogoQuery,
  useGetPatientQuery,
} from '@/model/api/generated/mentoraApi';
import { type Letterhead, PrescriptionBuilder } from '@/model/domain/prescriptions/Prescription';
import { useBrowserActions, useUserFeedback } from '@/model/platform/Platform';
import { useTranslation } from '@/shared/i18n';

export type { Letterhead };

export interface PrescriptionViewModel {
  patientId: string;
  isLoading: boolean;
  letterhead: Letterhead | null;
  patientName: string;
  patientDetail: string;
  date: string;
  content: string;
  setContent: (content: string) => void;
  canGenerate: boolean;
  isGenerating: boolean;
  print: () => void;
  downloadPdf: () => Promise<void>;
}

// ViewModel
export function usePrescriptionViewModel(): PrescriptionViewModel {
  const { t } = useTranslation();
  const feedback = useUserFeedback();
  const browser = useBrowserActions();
  const { patientId = '' } = useParams();
  const { data: patient, isLoading: loadingPatient } = useGetPatientQuery({ id: patientId });
  const { data: session, isLoading: loadingSession } = useGetCurrentProfessionalQuery();
  const { data: logo, isLoading: loadingLogo } = useGetLogoQuery();
  const [content, setContent] = useState('');
  const [isGenerating, setGenerating] = useState(false);
  const [now] = useState(() => new Date());

  const letterhead = useMemo(
    () => (session ? PrescriptionBuilder.letterhead(session, logo) : null),
    [session, logo],
  );
  const prescription = useMemo(
    () =>
      letterhead && patient ? PrescriptionBuilder.build(letterhead, patient, content, now) : null,
    [letterhead, patient, content, now],
  );

  return {
    patientId,
    isLoading: loadingPatient || loadingSession || loadingLogo,
    letterhead,
    patientName: prescription?.patientName ?? '',
    patientDetail: prescription?.patientDetail ?? '',
    date: prescription?.date ?? '',
    content,
    setContent,
    canGenerate: content.trim().length > 0,
    isGenerating,
    print: () => browser.print(),
    downloadPdf: async () => {
      if (!prescription?.content) {
        return;
      }
      setGenerating(true);
      try {
        const { PrescriptionPdfAdapter } = await import(
          '@/model/domain/prescriptions/PrescriptionPdfAdapter'
        );
        PrescriptionPdfAdapter.download(prescription);
      } catch {
        feedback.error(t('prescription.pdfFailed'));
      } finally {
        setGenerating(false);
      }
    },
  };
}
