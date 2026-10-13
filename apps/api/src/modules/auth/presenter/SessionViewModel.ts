import type { ProfessionalDto, SessionDto } from '../contracts/auth.contracts';
import type { Professional } from '../model/Professional';

/** Output of the log-in and register use cases: the body plus the token for the cookie. */
export interface SessionResult {
  token: string;
  session: SessionDto;
}

/** Maps the `Professional` aggregate to the session DTO shared by several presenters. */
export class SessionViewModel {
  static from(professional: Professional, now: Date): SessionDto {
    const { subscription } = professional;
    return {
      professional: SessionViewModel.professional(professional),
      subscription: {
        status: subscription.statusAt(now),
        accessEndsAt: subscription.accessEndsAt?.toISOString() ?? null,
        daysLeft: subscription.daysLeftAt(now),
      },
    };
  }

  private static professional(professional: Professional): ProfessionalDto {
    return {
      id: professional.id,
      firstName: professional.firstName,
      lastName: professional.lastName,
      fullName: professional.fullName,
      email: professional.email,
      phone: professional.phone ?? '',
      specialty: professional.specialty,
      licenseNumber: professional.licenseNumber,
    };
  }
}
