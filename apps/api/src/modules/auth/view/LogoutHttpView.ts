import type { HttpResponder } from '#core/view/HttpResponder';
import { HttpView } from '#core/view/HttpView';
import type { SessionCookie } from '#infrastructure/http/SessionCookie';

// Passive View
export class LogoutHttpView extends HttpView<void> {
  constructor(
    responder: HttpResponder,
    private readonly cookie: SessionCookie,
  ) {
    super(responder);
  }

  override render(): void {
    this.cookie.clear(this.responder);
    this.responder.noContent();
  }
}
