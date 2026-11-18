import { Router } from 'express';
import { PageQuerySchema } from '#core/contracts/Pagination';
import { InputParser } from '#core/view/InputParser';
import { JsonHttpView } from '#core/view/JsonHttpView';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { ExpressResponderAdapter } from '#infrastructure/http/ExpressResponderAdapter';
import {
  type ClinicalRecordDto,
  type ConsultationDto,
  ConsultationParamsSchema,
  type DiagnosisHistoryPageDto,
  PatientRecordParamsSchema,
  type RecordAccessPageDto,
  RegisterConsultationRequestSchema,
} from '../contracts/clinical-records.contracts';
import type { ClinicalRecordPresenterFactory } from '../presenter/ClinicalRecordPresenterFactory';

export class ClinicalRecordRoutes {
  constructor(
    private readonly presenters: ClinicalRecordPresenterFactory,
    private readonly guard: AuthGuard,
  ) {}

  build(): Router {
    const router = Router();
    const base = '/:patientId/clinical-record';
    router.use(base, this.guard.requireActiveSubscription);

    router.get(base, async (req, res) => {
      const view = new JsonHttpView<ClinicalRecordDto>(new ExpressResponderAdapter(res));
      const { patientId } = InputParser.parse(PatientRecordParamsSchema, req.params);
      const page = InputParser.parse(PageQuerySchema, req.query);
      await this.presenters
        .getClinicalRecord(view)
        .present({ actor: ActorReader.from(res), patientId, ...page });
    });

    router.post(`${base}/consultations`, async (req, res) => {
      const view = new JsonHttpView<ConsultationDto>(new ExpressResponderAdapter(res), 201);
      const { patientId } = InputParser.parse(PatientRecordParamsSchema, req.params);
      const data = InputParser.parse(RegisterConsultationRequestSchema, req.body);
      await this.presenters
        .registerConsultation(view)
        .present({ actor: ActorReader.from(res), patientId, data });
    });

    router.get(`${base}/consultations/:consultationId`, async (req, res) => {
      const view = new JsonHttpView<ConsultationDto>(new ExpressResponderAdapter(res));
      const params = InputParser.parse(ConsultationParamsSchema, req.params);
      await this.presenters
        .getConsultation(view)
        .present({ actor: ActorReader.from(res), ...params });
    });

    router.get(`${base}/diagnoses`, async (req, res) => {
      const view = new JsonHttpView<DiagnosisHistoryPageDto>(new ExpressResponderAdapter(res));
      const { patientId } = InputParser.parse(PatientRecordParamsSchema, req.params);
      const page = InputParser.parse(PageQuerySchema, req.query);
      await this.presenters
        .getDiagnosisHistory(view)
        .present({ actor: ActorReader.from(res), patientId, ...page });
    });

    router.get(`${base}/access-log`, async (req, res) => {
      const view = new JsonHttpView<RecordAccessPageDto>(new ExpressResponderAdapter(res));
      const { patientId } = InputParser.parse(PatientRecordParamsSchema, req.params);
      const page = InputParser.parse(PageQuerySchema, req.query);
      await this.presenters
        .listRecordAccess(view)
        .present({ actor: ActorReader.from(res), patientId, ...page });
    });

    return router;
  }
}
