const ACCEPTED = ['image/png', 'image/jpeg'];
const MAX_BYTES = 512 * 1024;

export class LogoFile {
  static readonly ACCEPT = ACCEPTED.join(',');
  static readonly HINT = 'PNG or JPEG, up to 512 KB';

  static problemWith(file: { type: string; size: number }): string | null {
    if (!ACCEPTED.includes(file.type)) {
      return `Unsupported format. Accepted: ${LogoFile.HINT}`;
    }
    if (file.size > MAX_BYTES) {
      return `The logo is too large. Accepted: ${LogoFile.HINT}`;
    }
    return null;
  }
}
