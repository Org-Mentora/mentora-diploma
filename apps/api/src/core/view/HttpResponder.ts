export interface CookieOptions {
  maxAgeSeconds: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict';
}

/**
 * Minimal HTTP output surface the views depend on. The Express implementation is an
 * Adapter (`ExpressResponderAdapter`), which keeps views framework-agnostic and testable.
 */
export interface HttpResponder {
  send(status: number, body: unknown): void;
  noContent(): void;
  setCookie(name: string, value: string, options: CookieOptions): void;
  clearCookie(name: string): void;
}
