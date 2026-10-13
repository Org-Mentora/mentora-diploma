import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Empty RTK Query API. Endpoints are injected by the generated `generated/mentoraApi.ts`
 * (run `pnpm codegen`), so this file only holds transport configuration.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  // `include` sends the httpOnly session cookie (ADR-0018).
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL ?? '/api',
    credentials: 'include',
  }),
  endpoints: () => ({}),
});
