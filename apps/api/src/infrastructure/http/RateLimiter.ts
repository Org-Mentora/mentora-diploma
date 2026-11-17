import type { Request, RequestHandler } from 'express';
import { TooManyRequestsError } from '#core/errors/ApplicationError';
import type { RateLimitStore } from './RateLimitStore';

export interface RateLimitRule {
  name: string;
  limit: number;
  windowMs: number;
  key: (req: Request) => string | null;
}

export class RateLimiter {
  constructor(
    private readonly enabled: boolean,
    private readonly store: RateLimitStore,
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
    return async (req, res, next) => {
      if (!this.enabled) {
        next();
        return;
      }
      for (const rule of rules) {
        const key = rule.key(req);
        if (key === null) {
          continue;
        }
        const now = this.now();
        const window = await this.store.hit(`${rule.name}:${key}`, rule.windowMs, now);
        if (window.count > rule.limit) {
          const seconds = Math.max(1, Math.ceil((window.resetsAt - now) / 1000));
          res.setHeader('Retry-After', String(seconds));
          throw new TooManyRequestsError(seconds);
        }
      }
      next();
    };
  }
}
