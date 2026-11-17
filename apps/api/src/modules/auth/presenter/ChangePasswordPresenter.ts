import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { ChangePasswordRequestDto } from '../contracts/auth.contracts';
import type { AuthService } from '../model/AuthService';
import { type SessionResult, SessionViewModel } from './SessionViewModel';

export type ChangePasswordInput = { actor: AuthenticatedActor; data: ChangePasswordRequestDto };

// Presenter
export class ChangePasswordPresenter extends Presenter<ChangePasswordInput, SessionResult> {
  constructor(
    view: View<SessionResult>,
    private readonly auth: AuthService,
  ) {
    super(view);
  }

  protected async execute(input: ChangePasswordInput): Promise<SessionResult> {
    const subject = await this.auth.changePassword(
      input.actor.professionalId,
      input.data.currentPassword,
      input.data.newPassword,
    );
    return {
      token: await this.auth.issueSessionToken(subject),
      session: SessionViewModel.from(subject),
    };
  }
}
