import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { LoginRequestDto } from '../contracts/auth.contracts';
import type { AuthService } from '../model/AuthService';
import { type SessionResult, SessionViewModel } from './SessionViewModel';

/**
 * CU-01 Log in. An expired trial still gets a session (status `expired`) so the UI can send
 * the professional to plan management; the guard blocks every other protected route.
 */
export class LoginPresenter extends Presenter<LoginRequestDto, SessionResult> {
  constructor(
    view: View<SessionResult>,
    private readonly auth: AuthService,
  ) {
    super(view);
  }

  protected async execute(input: LoginRequestDto): Promise<SessionResult> {
    const professional = await this.auth.authenticate(input.email, input.password);
    return {
      token: await this.auth.issueSessionToken(professional),
      session: SessionViewModel.from(professional, this.auth.now),
    };
  }
}
