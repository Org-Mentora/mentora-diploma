import type { HttpResponder } from './HttpResponder';
import { HttpView } from './HttpView';

/**
 * Generic passive JSON view for view models that need no transport-specific shaping.
 * Pass `201` for creations.
 */
export class JsonHttpView<TViewModel> extends HttpView<TViewModel> {
  constructor(
    responder: HttpResponder,
    protected override readonly successStatus: number = 200,
  ) {
    super(responder);
  }
}
