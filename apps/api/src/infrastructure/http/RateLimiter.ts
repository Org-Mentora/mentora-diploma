import type { Request, RequestHandler } from 'express';
import { TooManyRequestsError } from '#core/errors/ApplicationError';

export interface RateLimitRule {
  name: string;
  limit: number;
  windowMs: number;
  key: (req: Request) => string | null;
}

interface Window {
  count: number;
  resetsAt: number;
}

const SWEEP_ABOVE = 10_000;

export class RateLimiter {
  readonly #windows = new Map<string, Window>();

  constructor(
    private readonly enabled: boolean,
    private readonly now: () => number = Date.now,
  ) {}

  static byIp(req: Request): string {
    return req.ip ?? 'unknown';
  }

  static byEmail(req: Request): string | null {
    const email: unknown = req.body?.email;
    return typeof email === 'string' && email.length > 0 ? email.trim().toLowerCase() : null;
  }

  limit(...rules: RateLimitRule[]): RequestHandler {
    return (req, res, next) => {
      if (!this.enabled) {
        next();
        return;
      }
      for (const rule of rules) {
        const key = rule.key(req);
        if (key === null) {
          continue;
        }
        const retryAfterMs = this.hit(`${rule.name}:${key}`, rule);
        if (retryAfterMs > 0) {
          const seconds = Math.ceil(retryAfterMs / 1000);
          res.setHeader('Retry-After', String(seconds));
          throw new TooManyRequestsError(seconds);
        }
      }
      next();
    };
  }

  private hit(id: string, rule: RateLimitRule): number {
    const now = this.now();
    this.sweep(now);
    const current = this.#windows.get(id);
    if (!current || current.resetsAt <= now) {
      this.#windows.set(id, { count: 1, resetsAt: now + rule.windowMs });
      return 0;
    }
    current.count += 1;
    return current.count > rule.limit ? current.resetsAt - now : 0;
  }

  private sweep(now: number): void {
    if (this.#windows.size < SWEEP_ABOVE) {
      return;
    }
    for (const [id, window] of this.#windows) {
      if (window.resetsAt <= now) {
        this.#windows.delete(id);
      }
    }
  }
}
