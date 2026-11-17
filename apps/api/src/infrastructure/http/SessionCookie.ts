import type { HttpResponder } from '#core/view/HttpResponder';

export const SESSION_COOKIE_NAME = 'mentora_session';

export class SessionCookie {
  constructor(
    private readonly secure: boolean,
    private readonly maxAgeSeconds: number,
  ) {}

  write(responder: HttpResponder, token: string): void {
    responder.setCookie(SESSION_COOKIE_NAME, token, {
      maxAgeSeconds: this.maxAgeSeconds,
      httpOnly: true,
      secure: this.secure,
      sameSite: 'lax',
    });
  }

  clear(responder: HttpResponder): void {
    responder.clearCookie(SESSION_COOKIE_NAME);
  }
}
