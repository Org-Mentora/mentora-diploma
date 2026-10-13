import type { Response } from 'express';
import type { CookieOptions, HttpResponder } from '#core/view/HttpResponder';

/** Adapter (ADR-0007): lets passive views write to an Express `Response`. */
export class ExpressResponderAdapter implements HttpResponder {
  constructor(private readonly response: Response) {}

  send(status: number, body: unknown): void {
    this.response.status(status).json(body);
  }

  noContent(): void {
    this.response.status(204).end();
  }

  setCookie(name: string, value: string, options: CookieOptions): void {
    this.response.cookie(name, value, {
      maxAge: options.maxAgeSeconds * 1000,
      httpOnly: options.httpOnly,
      secure: options.secure,
      sameSite: options.sameSite,
      path: '/',
    });
  }

  clearCookie(name: string): void {
    this.response.clearCookie(name, { path: '/' });
  }
}
