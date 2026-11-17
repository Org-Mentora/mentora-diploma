export interface BrowserActions {
  print(): void;
  copyText(text: string): Promise<void>;
  absoluteUrl(path: string): string;
}
