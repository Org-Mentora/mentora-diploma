import type { BrowserActions } from './BrowserActions';

// Adapter
export class WindowBrowserActions implements BrowserActions {
  print(): void {
    window.print();
  }

  copyText(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
  }
}
