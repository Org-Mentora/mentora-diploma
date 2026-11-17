import type { RecordAccessDto } from '@mentora/contracts';

export interface RecordAccessItem {
  key: string;
  actionLabel: string;
  whenLabel: string;
}

const ACTION: Record<RecordAccessDto['action'], string> = {
  view_record: 'Opened the clinical record',
  view_consultation: 'Opened a consultation',
  view_diagnoses: 'Opened the diagnosis history',
  register_consultation: 'Registered a consultation',
};

const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

// Adapter
export class RecordAccessAdapter {
  static toItems(dtos: RecordAccessDto[]): RecordAccessItem[] {
    return dtos.map((dto, index) => ({
      key: `${dto.at}-${index}`,
      actionLabel: ACTION[dto.action],
      whenLabel: dateTime.format(new Date(dto.at)),
    }));
  }
}
