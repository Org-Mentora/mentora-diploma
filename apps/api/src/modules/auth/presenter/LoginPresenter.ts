import { Presenter } from '#core/presenter/Presenter';
import type { LoginRequestDto } from '../contracts/auth.contracts';
import type { AuthService } from '../model/AuthService';
import { type SessionResult, SessionViewModel } from './SessionViewModel';

// Presenter
export class LoginPresenter extends Presenter<LoginRequestDto, SessionResult, AuthService> {
  protected async execute(input: LoginRequestDto): Promise<SessionResult> {
    const subject = await this.model.authenticate(input.email, input.password);
    return {
      token: await this.model.issueSessionToken(subject),
      session: SessionViewModel.from(subject),
    };
  }
}
