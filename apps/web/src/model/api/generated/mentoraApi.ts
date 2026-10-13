import { baseApi as api } from "../baseApi";
export const addTagTypes = ["Health"] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      getHealth: build.query<GetHealthApiResponse, GetHealthApiArg>({
        query: () => ({ url: `/health` }),
        providesTags: ["Health"],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as mentoraApi };
export type GetHealthApiResponse = /** status 200 Health report */ HealthDto;
export type GetHealthApiArg = void;
export type ComponentHealthDto = {
  name: string;
  status: "up" | "down";
  latencyMs: number | null;
  error: string | null;
};
export type HealthDto = {
  status: "ok" | "degraded";
  uptimeSeconds: number;
  checkedAt: string;
  components: ComponentHealthDto[];
};
export type ErrorResponseDto = {
  error: {
    code: string;
    message: string;
    details?: any | null;
  };
};
export const { useGetHealthQuery } = injectedRtkApi;
