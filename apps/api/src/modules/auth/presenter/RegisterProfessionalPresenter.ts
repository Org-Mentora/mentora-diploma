import { Presenter } from '#core/presenter/Presenter';
import type { RegisterProfessionalRequestDto } from '../contracts/auth.contracts';
import type { AuthService } from '../model/AuthService';
import { type SessionResult, SessionViewModel } from './SessionViewModel';

// Presenter
export class RegisterProfessionalPresenter extends Presenter<
  RegisterProfessionalRequestDto,
  SessionResult,
  AuthService
> {
  protected async execute(input: RegisterProfessionalRequestDto): Promise<SessionResult> {
    const subject = await this.model.register({ ...input, offices: input.offices ?? [] });
    return {
      token: await this.model.issueSessionToken(subject),
      session: SessionViewModel.from(subject),
    };
  }
}
