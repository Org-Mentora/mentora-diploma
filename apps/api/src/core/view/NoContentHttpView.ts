import { HttpView } from './HttpView';

// Passive View
export class NoContentHttpView extends HttpView<void> {
  override render(): void {
    this.responder.noContent();
  }
}
