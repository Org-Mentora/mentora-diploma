const ACCEPTED = ['image/png', 'image/jpeg'];
const MAX_BYTES = 512 * 1024;

export class LogoFile {
  static readonly ACCEPT = ACCEPTED.join(',');
  static readonly HINT = 'validation.logoHint';

  static problemWith(file: { type: string; size: number }): string | null {
    if (!ACCEPTED.includes(file.type)) {
      return 'validation.logoFormat';
    }
    if (file.size > MAX_BYTES) {
      return 'validation.logoSize';
    }
    return null;
  }
}
