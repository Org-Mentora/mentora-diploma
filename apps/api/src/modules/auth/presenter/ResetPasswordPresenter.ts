import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { ResetPasswordRequestDto } from '../contracts/auth.contracts';
import type { PasswordRecoveryService } from '../model/PasswordRecoveryService';

export type ResetPasswordInput = ResetPasswordRequestDto;

// Presenter
export class ResetPasswordPresenter extends Presenter<ResetPasswordInput, void> {
  constructor(
    view: View<void>,
    private readonly recovery: PasswordRecoveryService,
  ) {
    super(view);
  }

  protected async execute(input: ResetPasswordInput): Promise<void> {
    await this.recovery.reset(input.email, input.code, input.newPassword);
  }
}
