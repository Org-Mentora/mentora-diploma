export interface RateLimitWindow {
  count: number;
  resetsAt: number;
}

export abstract class RateLimitStore {
  abstract hit(id: string, windowMs: number, now: number): Promise<RateLimitWindow>;
}
