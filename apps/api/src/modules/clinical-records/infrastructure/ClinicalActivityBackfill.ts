import type { ClinicalActivityRecorder } from '../model/ClinicalActivityRecorder';
import { ClinicalRecordModel } from './ClinicalRecordSchema';

interface LatestConsultation {
  _id: { professionalId: string; patientId: string };
  latest: Date;
}

export class ClinicalActivityBackfill {
  constructor(private readonly recorder: ClinicalActivityRecorder) {}

  async run(): Promise<number> {
    const latest = await ClinicalRecordModel.aggregate<LatestConsultation>([
      { $unwind: '$consultations' },
      {
        $group: {
          _id: { professionalId: '$professionalId', patientId: '$patientId' },
          latest: { $max: '$consultations.date' },
        },
      },
    ]);
    for (const entry of latest) {
      await this.recorder.record(entry._id.professionalId, entry._id.patientId, entry.latest);
    }
    return latest.length;
  }
}
