import { Router } from 'express';
import { InputParser } from '#core/view/InputParser';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { HttpViews } from '#infrastructure/http/HttpViews';
import {
  ChangePatientStatusSchema,
  PatientIdParamsSchema,
  PatientInputSchema,
  SearchPatientsQuerySchema,
} from '../contracts/patients.contracts';
import type { PatientPresenters } from '../presenter/PatientPresenters';

export class PatientRoutes {
  constructor(
    private readonly presenters: PatientPresenters,
    private readonly guard: AuthGuard,
  ) {}

  build(): Router {
    const router = Router();
    router.use(this.guard.requireActiveSubscription);

    router.post('/', async (req, res) => {
      const data = InputParser.parse(PatientInputSchema, req.body);
      await this.presenters
        .createPatient(HttpViews.json(res, 201))
        .present({ actor: ActorReader.from(res), data });
    });

    router.get('/', async (req, res) => {
      const { q, ...page } = InputParser.parse(SearchPatientsQuerySchema, req.query);
      await this.presenters
        .searchPatients(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), query: q, ...page });
    });

    router.get('/:id', async (req, res) => {
      const { id } = InputParser.parse(PatientIdParamsSchema, req.params);
      await this.presenters
        .getPatient(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), patientId: id });
    });

    router.put('/:id', async (req, res) => {
      const { id } = InputParser.parse(PatientIdParamsSchema, req.params);
      const data = InputParser.parse(PatientInputSchema, req.body);
      await this.presenters
        .updatePatient(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), patientId: id, data });
    });

    router.patch('/:id/status', async (req, res) => {
      const { id } = InputParser.parse(PatientIdParamsSchema, req.params);
      const data = InputParser.parse(ChangePatientStatusSchema, req.body);
      await this.presenters
        .changePatientStatus(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), patientId: id, data });
    });

    return router;
  }
}
