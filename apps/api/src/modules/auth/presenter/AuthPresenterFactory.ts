import type { View } from '#core/view/View';
import type { LogoDto, RecoveryRequestedDto, SessionDto } from '../contracts/auth.contracts';
import type { ChangePasswordPresenter } from './ChangePasswordPresenter';
import type { GetCurrentProfessionalPresenter } from './GetCurrentProfessionalPresenter';
import type { GetLogoPresenter } from './GetLogoPresenter';
import type { LoginPresenter } from './LoginPresenter';
import type { LogoutPresenter } from './LogoutPresenter';
import type { RegisterProfessionalPresenter } from './RegisterProfessionalPresenter';
import type { RemoveLogoPresenter } from './RemoveLogoPresenter';
import type { RequestPasswordRecoveryPresenter } from './RequestPasswordRecoveryPresenter';
import type { ResetPasswordPresenter } from './ResetPasswordPresenter';
import type { SessionResult } from './SessionViewModel';
import type { UpdateProfilePresenter } from './UpdateProfilePresenter';
import type { UploadLogoPresenter } from './UploadLogoPresenter';
import type { VerifyRecoveryCodePresenter } from './VerifyRecoveryCodePresenter';

// Abstract Factory
export interface AuthPresenterFactory {
  registerProfessional(view: View<SessionResult>): RegisterProfessionalPresenter;
  login(view: View<SessionResult>): LoginPresenter;
  logout(view: View<void>): LogoutPresenter;
  getCurrentProfessional(view: View<SessionResult>): GetCurrentProfessionalPresenter;
  requestPasswordRecovery(view: View<RecoveryRequestedDto>): RequestPasswordRecoveryPresenter;
  verifyRecoveryCode(view: View<void>): VerifyRecoveryCodePresenter;
  resetPassword(view: View<void>): ResetPasswordPresenter;
  changePassword(view: View<SessionResult>): ChangePasswordPresenter;
  updateProfile(view: View<SessionDto>): UpdateProfilePresenter;
  getLogo(view: View<LogoDto>): GetLogoPresenter;
  uploadLogo(view: View<void>): UploadLogoPresenter;
  removeLogo(view: View<void>): RemoveLogoPresenter;
}
