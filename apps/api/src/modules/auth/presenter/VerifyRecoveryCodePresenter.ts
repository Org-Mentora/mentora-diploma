import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { VerifyRecoveryCodeRequestDto } from '../contracts/auth.contracts';
import type { PasswordRecoveryService } from '../model/PasswordRecoveryService';

export type VerifyRecoveryCodeInput = VerifyRecoveryCodeRequestDto;

// Presenter
export class VerifyRecoveryCodePresenter extends Presenter<VerifyRecoveryCodeInput, void> {
  constructor(
    view: View<void>,
    private readonly recovery: PasswordRecoveryService,
  ) {
    super(view);
  }

  protected async execute(input: VerifyRecoveryCodeInput): Promise<void> {
    await this.recovery.verify(input.email, input.code);
  }
}
