import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { baseApi } from './baseApi';
import { mentoraApi } from './generated/mentoraApi';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('baseApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('checks the session again when any other request answers 401', async () => {
    let meCalls = 0;
    vi.stubGlobal(
      'Request',
      class extends Request {
        constructor(input: RequestInfo | URL, init?: RequestInit) {
          super(typeof input === 'string' ? new URL(input, 'http://localhost') : input, init);
        }
      },
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async (request: Request) => {
        if (new URL(request.url).pathname.endsWith('/auth/me')) {
          meCalls += 1;
          return meCalls === 1
            ? json(200, { professional: {} })
            : json(401, { error: { code: 'UNAUTHORIZED', message: 'Session expired' } });
        }
        return json(401, { error: { code: 'UNAUTHORIZED', message: 'Session expired' } });
      }),
    );
    const store = configureStore({
      reducer: { [baseApi.reducerPath]: baseApi.reducer },
      middleware: (getDefault) => getDefault().concat(baseApi.middleware),
    });

    await store.dispatch(mentoraApi.endpoints.getCurrentProfessional.initiate());
    await store.dispatch(mentoraApi.endpoints.searchPatients.initiate({}));

    await vi.waitFor(() => expect(meCalls).toBe(2));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(meCalls).toBe(2);
  });
});
