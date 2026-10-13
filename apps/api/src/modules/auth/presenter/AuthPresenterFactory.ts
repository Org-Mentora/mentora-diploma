import type { View } from '#core/view/View';
import type { SessionDto } from '../contracts/auth.contracts';
import type { GetCurrentProfessionalPresenter } from './GetCurrentProfessionalPresenter';
import type { LoginPresenter } from './LoginPresenter';
import type { RegisterProfessionalPresenter } from './RegisterProfessionalPresenter';
import type { SessionResult } from './SessionViewModel';

export interface AuthPresenterFactory {
  registerProfessional(view: View<SessionResult>): RegisterProfessionalPresenter;
  login(view: View<SessionResult>): LoginPresenter;
  getCurrentProfessional(view: View<SessionDto>): GetCurrentProfessionalPresenter;
}
