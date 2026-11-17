import { Router } from 'express';
import { InputParser } from '#core/view/InputParser';
import { JsonHttpView } from '#core/view/JsonHttpView';
import { NoContentHttpView } from '#core/view/NoContentHttpView';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { ExpressResponderAdapter } from '#infrastructure/http/ExpressResponderAdapter';
import { RateLimiter, type RateLimitRule } from '#infrastructure/http/RateLimiter';
import type { SessionCookie } from '#infrastructure/http/SessionCookie';
import {
  ChangePasswordRequestSchema,
  LoginRequestSchema,
  type LogoDto,
  PasswordRecoveryRequestSchema,
  type RecoveryRequestedDto,
  RegisterProfessionalRequestSchema,
  ResetPasswordRequestSchema,
  type SessionDto,
  UpdateProfileRequestSchema,
  UploadLogoRequestSchema,
  VerifyRecoveryCodeRequestSchema,
} from '../contracts/auth.contracts';
import type { AuthPresenterFactory } from '../presenter/AuthPresenterFactory';
import { SessionHttpView } from './SessionHttpView';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

const RULES = {
  loginPerAccount: {
    name: 'login-account',
    limit: 10,
    windowMs: 15 * MINUTE_MS,
    key: (req) => {
      const email = RateLimiter.byEmail(req);
      return email && `${RateLimiter.byIp(req)}|${email}`;
    },
  },
  loginPerIp: { name: 'login-ip', limit: 50, windowMs: 15 * MINUTE_MS, key: RateLimiter.byIp },
  registerPerIp: { name: 'register-ip', limit: 10, windowMs: HOUR_MS, key: RateLimiter.byIp },
  recoveryPerEmail: {
    name: 'recovery-email',
    limit: 5,
    windowMs: HOUR_MS,
    key: RateLimiter.byEmail,
  },
  recoveryPerIp: { name: 'recovery-ip', limit: 20, windowMs: HOUR_MS, key: RateLimiter.byIp },
  codePerIp: {
    name: 'recovery-code-ip',
    limit: 30,
    windowMs: 15 * MINUTE_MS,
    key: RateLimiter.byIp,
  },
} satisfies Record<string, RateLimitRule>;

export class AuthRoutes {
  constructor(
    private readonly presenters: AuthPresenterFactory,
    private readonly guard: AuthGuard,
    private readonly cookie: SessionCookie,
    private readonly limiter: RateLimiter,
  ) {}

  build(): Router {
    const router = Router();
    const limit = this.limiter;

    router.post('/register', limit.limit(RULES.registerPerIp), async (req, res) => {
      const view = new SessionHttpView(new ExpressResponderAdapter(res), this.cookie, 201);
      const input = InputParser.parse(RegisterProfessionalRequestSchema, req.body);
      await this.presenters.registerProfessional(view).present(input);
    });

    router.post(
      '/login',
      limit.limit(RULES.loginPerIp, RULES.loginPerAccount),
      async (req, res) => {
        const view = new SessionHttpView(new ExpressResponderAdapter(res), this.cookie, 200);
        const input = InputParser.parse(LoginRequestSchema, req.body);
        await this.presenters.login(view).present(input);
      },
    );

    router.post('/logout', (_req, res) => {
      const responder = new ExpressResponderAdapter(res);
      this.cookie.clear(responder);
      responder.noContent();
    });

    router.get('/me', this.guard.requireSession, async (_req, res) => {
      const view = new SessionHttpView(new ExpressResponderAdapter(res), this.cookie, 200);
      await this.presenters.getCurrentProfessional(view).present(ActorReader.from(res));
    });

    router.post(
      '/password-recovery',
      limit.limit(RULES.recoveryPerIp, RULES.recoveryPerEmail),
      async (req, res) => {
        const view = new JsonHttpView<RecoveryRequestedDto>(new ExpressResponderAdapter(res), 202);
        const input = InputParser.parse(PasswordRecoveryRequestSchema, req.body);
        await this.presenters.requestPasswordRecovery(view).present(input);
      },
    );

    router.post('/password-recovery/verify', limit.limit(RULES.codePerIp), async (req, res) => {
      const view = new NoContentHttpView(new ExpressResponderAdapter(res));
      const input = InputParser.parse(VerifyRecoveryCodeRequestSchema, req.body);
      await this.presenters.verifyRecoveryCode(view).present(input);
    });

    router.post('/password-recovery/reset', limit.limit(RULES.codePerIp), async (req, res) => {
      const view = new NoContentHttpView(new ExpressResponderAdapter(res));
      const input = InputParser.parse(ResetPasswordRequestSchema, req.body);
      await this.presenters.resetPassword(view).present(input);
    });

    router.put('/password', this.guard.requireSession, async (req, res) => {
      const view = new SessionHttpView(new ExpressResponderAdapter(res), this.cookie, 200);
      const data = InputParser.parse(ChangePasswordRequestSchema, req.body);
      await this.presenters.changePassword(view).present({ actor: ActorReader.from(res), data });
    });

    router.put('/profile', this.guard.requireSession, async (req, res) => {
      const view = new JsonHttpView<SessionDto>(new ExpressResponderAdapter(res));
      const data = InputParser.parse(UpdateProfileRequestSchema, req.body);
      await this.presenters.updateProfile(view).present({ actor: ActorReader.from(res), data });
    });

    router.get('/logo', this.guard.requireSession, async (_req, res) => {
      const view = new JsonHttpView<LogoDto>(new ExpressResponderAdapter(res));
      await this.presenters.getLogo(view).present(ActorReader.from(res));
    });

    router.put('/logo', this.guard.requireSession, async (req, res) => {
      const view = new NoContentHttpView(new ExpressResponderAdapter(res));
      const data = InputParser.parse(UploadLogoRequestSchema, req.body);
      await this.presenters.uploadLogo(view).present({ actor: ActorReader.from(res), data });
    });

    router.delete('/logo', this.guard.requireSession, async (_req, res) => {
      const view = new NoContentHttpView(new ExpressResponderAdapter(res));
      await this.presenters.removeLogo(view).present(ActorReader.from(res));
    });

    return router;
  }
}
