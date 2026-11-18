import { Presenter } from '#core/presenter/Presenter';
import type { PasswordRecoveryRequestDto, RecoveryRequestedDto } from '../contracts/auth.contracts';
import type { PasswordRecoveryService } from '../model/PasswordRecoveryService';

// Presenter
export class RequestPasswordRecoveryPresenter extends Presenter<
  PasswordRecoveryRequestDto,
  RecoveryRequestedDto,
  PasswordRecoveryService
> {
  protected async execute(input: PasswordRecoveryRequestDto): Promise<RecoveryRequestedDto> {
    await this.model.request(input.email);
    return {
      message:
        'If the email belongs to an account, we sent it a 6-digit code. It expires in 15 minutes.',
    };
  }
}
