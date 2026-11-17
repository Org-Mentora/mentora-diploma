import { ValidationError } from '#core/errors/ApplicationError';

export class PasswordPolicy {
  static readonly MIN_LENGTH = 8;

  static unmetCriteria(password: string): string[] {
    const unmet: string[] = [];
    if (password.length < PasswordPolicy.MIN_LENGTH) {
      unmet.push(`at least ${PasswordPolicy.MIN_LENGTH} characters`);
    }
    if (!/[a-zA-Z]/.test(password)) {
      unmet.push('at least one letter');
    }
    if (!/\d/.test(password)) {
      unmet.push('at least one number');
    }
    return unmet;
  }

  static assertSatisfiedBy(password: string, field = 'password'): void {
    const unmet = PasswordPolicy.unmetCriteria(password);
    if (unmet.length > 0) {
      throw new ValidationError(`Password must contain ${unmet.join(', ')}`, { field, unmet });
    }
  }
}
