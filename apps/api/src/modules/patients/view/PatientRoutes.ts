import { Router } from 'express';
import { InputParser } from '#core/view/InputParser';
import { JsonHttpView } from '#core/view/JsonHttpView';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { ExpressResponderAdapter } from '#infrastructure/http/ExpressResponderAdapter';
import {
  ChangePatientStatusSchema,
  type PatientDto,
  PatientIdParamsSchema,
  PatientInputSchema,
  type PatientSummaryDto,
  SearchPatientsQuerySchema,
} from '../contracts/patients.contracts';
import type { PatientPresenterFactory } from '../presenter/PatientPresenterFactory';

/** HTTP entry points of CU-04..CU-07. Every route requires an active subscription. */
export class PatientRoutes {
  constructor(
    private readonly presenters: PatientPresenterFactory,
    private readonly guard: AuthGuard,
  ) {}

  build(): Router {
    const router = Router();
    router.use(this.guard.requireActiveSubscription);

    router.post('/', async (req, res) => {
      const view = new JsonHttpView<PatientDto>(new ExpressResponderAdapter(res), 201);
      const data = InputParser.parse(PatientInputSchema, req.body);
      await this.presenters.createPatient(view).present({ actor: ActorReader.from(res), data });
    });

    router.get('/', async (req, res) => {
      const view = new JsonHttpView<PatientSummaryDto[]>(new ExpressResponderAdapter(res));
      const { q } = InputParser.parse(SearchPatientsQuerySchema, req.query);
      await this.presenters
        .searchPatients(view)
        .present({ actor: ActorReader.from(res), query: q });
    });

    router.get('/:id', async (req, res) => {
      const view = new JsonHttpView<PatientDto>(new ExpressResponderAdapter(res));
      const { id } = InputParser.parse(PatientIdParamsSchema, req.params);
      await this.presenters
        .getPatient(view)
        .present({ actor: ActorReader.from(res), patientId: id });
    });

    router.put('/:id', async (req, res) => {
      const view = new JsonHttpView<PatientDto>(new ExpressResponderAdapter(res));
      const { id } = InputParser.parse(PatientIdParamsSchema, req.params);
      const data = InputParser.parse(PatientInputSchema, req.body);
      await this.presenters
        .updatePatient(view)
        .present({ actor: ActorReader.from(res), patientId: id, data });
    });

    router.patch('/:id/status', async (req, res) => {
      const view = new JsonHttpView<PatientDto>(new ExpressResponderAdapter(res));
      const { id } = InputParser.parse(PatientIdParamsSchema, req.params);
      const data = InputParser.parse(ChangePatientStatusSchema, req.body);
      await this.presenters
        .changePatientStatus(view)
        .present({ actor: ActorReader.from(res), patientId: id, data });
    });

    return router;
  }
}
