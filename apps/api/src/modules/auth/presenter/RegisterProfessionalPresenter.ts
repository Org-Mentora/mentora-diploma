import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { RegisterProfessionalRequestDto } from '../contracts/auth.contracts';
import type { AuthService } from '../model/AuthService';
import { type SessionResult, SessionViewModel } from './SessionViewModel';

/** CU-03 Register professional: creates the account, starts the trial and opens a session. */
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
    const professional = await this.auth.register(input);
    return {
      token: await this.auth.issueSessionToken(professional),
      session: SessionViewModel.from(professional, this.auth.now),
    };
  }
}
