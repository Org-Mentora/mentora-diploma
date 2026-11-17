import { Entity } from '#core/model/Entity';

export interface PasswordRecoveryProps {
  professionalId: string;
  codeHash: string;
  expiresAt: Date;
  failedAttempts: number;
  usedAt: Date | null;
  createdAt: Date;
}

const MINUTE_MS = 60_000;

// Aggregate Root
export class PasswordRecovery extends Entity<PasswordRecoveryProps> {
  static readonly TTL_MINUTES = 15;
  static readonly MAX_ATTEMPTS = 5;

  static issue(professionalId: string, codeHash: string, now: Date): PasswordRecovery {
    return new PasswordRecovery(crypto.randomUUID(), {
      professionalId,
      codeHash,
      expiresAt: new Date(now.getTime() + PasswordRecovery.TTL_MINUTES * MINUTE_MS),
      failedAttempts: 0,
      usedAt: null,
      createdAt: now,
    });
  }

  static restore(id: string, props: PasswordRecoveryProps): PasswordRecovery {
    return new PasswordRecovery(id, props);
  }

  isUsableAt(now: Date): boolean {
    return (
      this.props.usedAt === null &&
      this.props.expiresAt.getTime() > now.getTime() &&
      this.props.failedAttempts < PasswordRecovery.MAX_ATTEMPTS
    );
  }

  recordFailedAttempt(): void {
    this.props = { ...this.props, failedAttempts: this.props.failedAttempts + 1 };
  }

  invalidate(now: Date): void {
    if (this.props.usedAt === null) {
      this.props = { ...this.props, usedAt: now };
    }
  }

  get professionalId(): string {
    return this.props.professionalId;
  }

  get codeHash(): string {
    return this.props.codeHash;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get failedAttempts(): number {
    return this.props.failedAttempts;
  }

  get usedAt(): Date | null {
    return this.props.usedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
