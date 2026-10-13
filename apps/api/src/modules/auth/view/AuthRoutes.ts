import { Router } from 'express';
import { HttpView } from '#core/view/HttpView';
import { InputParser } from '#core/view/InputParser';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { ExpressResponderAdapter } from '#infrastructure/http/ExpressResponderAdapter';
import type { SessionCookie } from '#infrastructure/http/SessionCookie';
import {
  LoginRequestSchema,
  RegisterProfessionalRequestSchema,
  type SessionDto,
} from '../contracts/auth.contracts';
import type { AuthPresenterFactory } from '../presenter/AuthPresenterFactory';
import { SessionHttpView } from './SessionHttpView';

class CurrentSessionHttpView extends HttpView<SessionDto> {}

export class AuthRoutes {
  constructor(
    private readonly presenters: AuthPresenterFactory,
    private readonly guard: AuthGuard,
    private readonly cookie: SessionCookie,
  ) {}

  build(): Router {
    const router = Router();

    router.post('/register', async (req, res) => {
      const view = new SessionHttpView(new ExpressResponderAdapter(res), this.cookie, 201);
      const input = InputParser.parse(RegisterProfessionalRequestSchema, req.body);
      await this.presenters.registerProfessional(view).present(input);
    });

    router.post('/login', async (req, res) => {
      const view = new SessionHttpView(new ExpressResponderAdapter(res), this.cookie, 200);
      const input = InputParser.parse(LoginRequestSchema, req.body);
      await this.presenters.login(view).present(input);
    });

    router.post('/logout', (_req, res) => {
      const responder = new ExpressResponderAdapter(res);
      this.cookie.clear(responder);
      responder.noContent();
    });

    router.get('/me', this.guard.requireSession, async (_req, res) => {
      const view = new CurrentSessionHttpView(new ExpressResponderAdapter(res));
      await this.presenters.getCurrentProfessional(view).present(ActorReader.from(res));
    });

    return router;
  }
}
