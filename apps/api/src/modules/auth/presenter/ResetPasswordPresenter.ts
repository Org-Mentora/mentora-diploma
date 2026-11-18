import { Presenter } from '#core/presenter/Presenter';
import type { ResetPasswordRequestDto } from '../contracts/auth.contracts';
import type { PasswordRecoveryService } from '../model/PasswordRecoveryService';

export type ResetPasswordInput = ResetPasswordRequestDto;

// Presenter
export class ResetPasswordPresenter extends Presenter<
  ResetPasswordInput,
  void,
  PasswordRecoveryService
> {
  protected async execute(input: ResetPasswordInput): Promise<void> {
    await this.model.reset(input.email, input.code, input.newPassword);
  }
}
