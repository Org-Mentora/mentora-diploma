import { Presenter } from '#core/presenter/Presenter';
import type { VerifyRecoveryCodeRequestDto } from '../contracts/auth.contracts';
import type { PasswordRecoveryService } from '../model/PasswordRecoveryService';

export type VerifyRecoveryCodeInput = VerifyRecoveryCodeRequestDto;

// Presenter
export class VerifyRecoveryCodePresenter extends Presenter<
  VerifyRecoveryCodeInput,
  void,
  PasswordRecoveryService
> {
  protected async execute(input: VerifyRecoveryCodeInput): Promise<void> {
    await this.model.verify(input.email, input.code);
  }
}
