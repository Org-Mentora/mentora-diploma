import type { RecordAccessDto } from '@mentora/contracts';
import { translate as t } from '@/shared/i18n';
import { Formats } from '../format/Formats';

export interface RecordAccessItem {
  key: string;
  actionLabel: string;
  whenLabel: string;
}

// Adapter
export class RecordAccessAdapter {
  static toItems(dtos: RecordAccessDto[]): RecordAccessItem[] {
    return dtos.map((dto, index) => ({
      key: `${dto.at}-${index}`,
      actionLabel: t(`clinical.access.${dto.action}`),
      whenLabel: Formats.date(dto.at, 'dateTime'),
    }));
  }
}
