import type { View } from '#core/view/View';
import type { LogoDto, RecoveryRequestedDto, SessionDto } from '../contracts/auth.contracts';
import type { AuthService } from '../model/AuthService';
import type { PasswordRecoveryService } from '../model/PasswordRecoveryService';
import type { ProfileService } from '../model/ProfileService';
import { ChangePasswordPresenter } from './ChangePasswordPresenter';
import { GetCurrentProfessionalPresenter } from './GetCurrentProfessionalPresenter';
import { GetLogoPresenter } from './GetLogoPresenter';
import { LoginPresenter } from './LoginPresenter';
import { LogoutPresenter } from './LogoutPresenter';
import { RegisterProfessionalPresenter } from './RegisterProfessionalPresenter';
import { RemoveLogoPresenter } from './RemoveLogoPresenter';
import { RequestPasswordRecoveryPresenter } from './RequestPasswordRecoveryPresenter';
import { ResetPasswordPresenter } from './ResetPasswordPresenter';
import type { SessionResult } from './SessionViewModel';
import { UpdateProfilePresenter } from './UpdateProfilePresenter';
import { UploadLogoPresenter } from './UploadLogoPresenter';
import { VerifyRecoveryCodePresenter } from './VerifyRecoveryCodePresenter';

// Abstract Factory
export class AuthPresenters {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordRecoveryService: PasswordRecoveryService,
    private readonly profileService: ProfileService,
  ) {}

  registerProfessional(view: View<SessionResult>) {
    return new RegisterProfessionalPresenter(view, this.authService);
  }

  login(view: View<SessionResult>) {
    return new LoginPresenter(view, this.authService);
  }

  logout(view: View<void>) {
    return new LogoutPresenter(view, this.authService);
  }

  getCurrentProfessional(view: View<SessionResult>) {
    return new GetCurrentProfessionalPresenter(view, this.authService);
  }

  requestPasswordRecovery(view: View<RecoveryRequestedDto>) {
    return new RequestPasswordRecoveryPresenter(view, this.passwordRecoveryService);
  }

  verifyRecoveryCode(view: View<void>) {
    return new VerifyRecoveryCodePresenter(view, this.passwordRecoveryService);
  }

  resetPassword(view: View<void>) {
    return new ResetPasswordPresenter(view, this.passwordRecoveryService);
  }

  changePassword(view: View<SessionResult>) {
    return new ChangePasswordPresenter(view, this.authService);
  }

  updateProfile(view: View<SessionDto>) {
    return new UpdateProfilePresenter(view, this.profileService);
  }

  getLogo(view: View<LogoDto>) {
    return new GetLogoPresenter(view, this.profileService);
  }

  uploadLogo(view: View<void>) {
    return new UploadLogoPresenter(view, this.profileService);
  }

  removeLogo(view: View<void>) {
    return new RemoveLogoPresenter(view, this.profileService);
  }
}
