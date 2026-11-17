import {
  type BaseQueryFn,
  createApi,
  type FetchArgs,
  type FetchBaseQueryError,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL ?? '/api',
  credentials: 'include',
});

function isSubscriptionInactive(error: FetchBaseQueryError | undefined): boolean {
  const data = error?.data as { error?: { code?: string } } | undefined;
  return error?.status === 403 && data?.error?.code === 'SUBSCRIPTION_INACTIVE';
}

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (isSubscriptionInactive(result.error)) {
    api.dispatch(baseApi.util.invalidateTags(['Auth']));
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Auth'],
  endpoints: () => ({}),
});
