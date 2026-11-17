import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { LoginRequestDto } from '../contracts/auth.contracts';
import type { AuthService } from '../model/AuthService';
import { type SessionResult, SessionViewModel } from './SessionViewModel';

// Presenter
export class LoginPresenter extends Presenter<LoginRequestDto, SessionResult> {
  constructor(
    view: View<SessionResult>,
    private readonly auth: AuthService,
  ) {
    super(view);
  }

  protected async execute(input: LoginRequestDto): Promise<SessionResult> {
    const subject = await this.auth.authenticate(input.email, input.password);
    return {
      token: await this.auth.issueSessionToken(subject),
      session: SessionViewModel.from(subject),
    };
  }
}
