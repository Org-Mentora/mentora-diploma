import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { RegisterProfessionalRequestDto } from '../contracts/auth.contracts';
import type { AuthService } from '../model/AuthService';
import { type SessionResult, SessionViewModel } from './SessionViewModel';

// Presenter
export class RegisterProfessionalPresenter extends Presenter<
  RegisterProfessionalRequestDto,
  SessionResult
> {
  constructor(
    view: View<SessionResult>,
    private readonly auth: AuthService,
  ) {
    super(view);
  }

  protected async execute(input: RegisterProfessionalRequestDto): Promise<SessionResult> {
    const subject = await this.auth.register({ ...input, offices: input.offices ?? [] });
    return {
      token: await this.auth.issueSessionToken(subject),
      session: SessionViewModel.from(subject),
    };
  }
}
