export interface CookieOptions {
  maxAgeSeconds: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict';
}

export interface HttpResponder {
  send(status: number, body: unknown): void;
  noContent(): void;
  setCookie(name: string, value: string, options: CookieOptions): void;
  clearCookie(name: string): void;
}
