import { ValidationError } from '#core/errors/ApplicationError';
import { ValueObject } from '#core/model/ValueObject';

export type LogoMimeType = 'image/png' | 'image/jpeg';

interface ProfessionalLogoProps {
  mimeType: LogoMimeType;
  base64: string;
}

const SIGNATURES: Record<LogoMimeType, number[]> = {
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/jpeg': [0xff, 0xd8, 0xff],
};

// Value Object
export class ProfessionalLogo extends ValueObject<ProfessionalLogoProps> {
  static readonly MAX_BYTES = 512 * 1024;
  static readonly ACCEPTED = 'PNG or JPEG, up to 512 KB';

  static fromDataUrl(dataUrl: string): ProfessionalLogo {
    const match = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
    if (!match) {
      throw ProfessionalLogo.unsupported();
    }
    const mimeType = match[1] as LogoMimeType;
    const base64 = match[2] as string;
    const padding = base64.length - base64.replace(/=+$/, '').length;
    const bytes = (base64.length * 3) / 4 - padding;
    if (bytes > ProfessionalLogo.MAX_BYTES) {
      throw new ValidationError(`The logo is too large. Accepted: ${ProfessionalLogo.ACCEPTED}`, {
        field: 'logo',
      });
    }
    const head = atob(base64.slice(0, 8));
    const signature = SIGNATURES[mimeType];
    if (!signature.every((byte, i) => head.charCodeAt(i) === byte)) {
      throw ProfessionalLogo.unsupported();
    }
    return new ProfessionalLogo({ mimeType, base64 });
  }

  static restore(mimeType: LogoMimeType, base64: string): ProfessionalLogo {
    return new ProfessionalLogo({ mimeType, base64 });
  }

  private static unsupported(): ValidationError {
    return new ValidationError(`Unsupported logo format. Accepted: ${ProfessionalLogo.ACCEPTED}`, {
      field: 'logo',
    });
  }

  get mimeType(): LogoMimeType {
    return this.props.mimeType;
  }

  get base64(): string {
    return this.props.base64;
  }

  toDataUrl(): string {
    return `data:${this.props.mimeType};base64,${this.props.base64}`;
  }
}
