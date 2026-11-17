export interface BrowserActions {
  print(): void;
  copyText(text: string): Promise<void>;
}
