import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { PasswordRecoveryRequestDto, RecoveryRequestedDto } from '../contracts/auth.contracts';
import type { PasswordRecoveryService } from '../model/PasswordRecoveryService';

// Presenter
export class RequestPasswordRecoveryPresenter extends Presenter<
  PasswordRecoveryRequestDto,
  RecoveryRequestedDto
> {
  constructor(
    view: View<RecoveryRequestedDto>,
    private readonly recovery: PasswordRecoveryService,
  ) {
    super(view);
  }

  protected async execute(input: PasswordRecoveryRequestDto): Promise<RecoveryRequestedDto> {
    await this.recovery.request(input.email);
    return {
      message:
        'If the email belongs to an account, we sent it a 6-digit code. It expires in 15 minutes.',
    };
  }
}
