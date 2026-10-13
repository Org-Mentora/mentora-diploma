/**
 * Minimal HTTP output surface the views depend on. The Express implementation is an
 * Adapter (`ExpressResponderAdapter`), which keeps views framework-agnostic and testable.
 */
export interface HttpResponder {
  send(status: number, body: unknown): void;
  noContent(): void;
}
