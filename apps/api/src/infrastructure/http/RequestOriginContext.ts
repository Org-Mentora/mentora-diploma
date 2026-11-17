import { AsyncLocalStorage } from 'node:async_hooks';
import type { RequestHandler } from 'express';

export interface RequestOrigin {
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
}

const MAX_USER_AGENT = 300;

export class RequestOriginContext {
  readonly #storage = new AsyncLocalStorage<RequestOrigin>();

  get current(): RequestOrigin | null {
    return this.#storage.getStore() ?? null;
  }

  readonly capture: RequestHandler = (req, res, next) => {
    const userAgent = req.get('user-agent')?.slice(0, MAX_USER_AGENT) ?? null;
    const requestId = res.getHeader('X-Request-Id');
    this.#storage.run(
      {
        ip: req.ip ?? null,
        userAgent,
        requestId: typeof requestId === 'string' ? requestId : null,
      },
      () => next(),
    );
  };
}
