import { Router } from 'express';
import { PageQuerySchema } from '#core/contracts/Pagination';
import { InputParser } from '#core/view/InputParser';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { HttpViews } from '#infrastructure/http/HttpViews';
import {
  ConsultationParamsSchema,
  PatientRecordParamsSchema,
  RegisterConsultationRequestSchema,
} from '../contracts/clinical-records.contracts';
import type { ClinicalRecordPresenters } from '../presenter/ClinicalRecordPresenters';

export class ClinicalRecordRoutes {
  constructor(
    private readonly presenters: ClinicalRecordPresenters,
    private readonly guard: AuthGuard,
  ) {}

  build(): Router {
    const router = Router();
    const base = '/:patientId/clinical-record';
    router.use(base, this.guard.requireActiveSubscription);

    router.get(base, async (req, res) => {
      const { patientId } = InputParser.parse(PatientRecordParamsSchema, req.params);
      const page = InputParser.parse(PageQuerySchema, req.query);
      await this.presenters
        .getClinicalRecord(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), patientId, ...page });
    });

    router.post(`${base}/consultations`, async (req, res) => {
      const { patientId } = InputParser.parse(PatientRecordParamsSchema, req.params);
      const data = InputParser.parse(RegisterConsultationRequestSchema, req.body);
      await this.presenters
        .registerConsultation(HttpViews.json(res, 201))
        .present({ actor: ActorReader.from(res), patientId, data });
    });

    router.get(`${base}/consultations/:consultationId`, async (req, res) => {
      const params = InputParser.parse(ConsultationParamsSchema, req.params);
      await this.presenters
        .getConsultation(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), ...params });
    });

    router.get(`${base}/diagnoses`, async (req, res) => {
      const { patientId } = InputParser.parse(PatientRecordParamsSchema, req.params);
      const page = InputParser.parse(PageQuerySchema, req.query);
      await this.presenters
        .getDiagnosisHistory(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), patientId, ...page });
    });

    router.get(`${base}/access-log`, async (req, res) => {
      const { patientId } = InputParser.parse(PatientRecordParamsSchema, req.params);
      const page = InputParser.parse(PageQuerySchema, req.query);
      await this.presenters
        .listRecordAccess(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), patientId, ...page });
    });

    return router;
  }
}
