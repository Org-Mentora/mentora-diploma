import type { HttpResponder } from '#core/view/HttpResponder';
import { HttpView } from '#core/view/HttpView';
import type { SessionCookie } from '#infrastructure/http/SessionCookie';
import type { SessionResult } from '../presenter/SessionViewModel';

/** Passive view: puts the token in the httpOnly cookie and only the session in the body. */
export class SessionHttpView extends HttpView<SessionResult> {
  constructor(
    responder: HttpResponder,
    private readonly cookie: SessionCookie,
    protected override readonly successStatus: number,
  ) {
    super(responder);
  }

  override render(viewModel: SessionResult): void {
    this.cookie.write(this.responder, viewModel.token);
    this.responder.send(this.successStatus, viewModel.session);
  }
}
