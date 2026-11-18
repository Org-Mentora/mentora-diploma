import type { Response } from 'express';
import { JsonHttpView } from '#core/view/JsonHttpView';
import { NoContentHttpView } from '#core/view/NoContentHttpView';
import type { View } from '#core/view/View';
import { ExpressResponderAdapter } from './ExpressResponderAdapter';

// Adapter
export class HttpViews {
  static json<TViewModel>(response: Response, status = 200): View<TViewModel> {
    return new JsonHttpView<TViewModel>(new ExpressResponderAdapter(response), status);
  }

  static noContent(response: Response): View<void> {
    return new NoContentHttpView(new ExpressResponderAdapter(response));
  }
}
