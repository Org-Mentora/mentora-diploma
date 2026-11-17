import type { HttpResponder } from './HttpResponder';
import { HttpView } from './HttpView';

// Passive View
export class JsonHttpView<TViewModel> extends HttpView<TViewModel> {
  constructor(
    responder: HttpResponder,
    protected override readonly successStatus: number = 200,
  ) {
    super(responder);
  }
}
