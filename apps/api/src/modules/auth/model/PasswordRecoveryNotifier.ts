export interface RecoveryCodeMessage {
  email: string;
  name: string;
  code: string;
  expiresAt: Date;
}

export abstract class PasswordRecoveryNotifier {
  abstract sendCode(message: RecoveryCodeMessage): Promise<void>;
}
