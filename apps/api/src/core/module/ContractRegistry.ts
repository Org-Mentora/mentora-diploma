import type { ZodObject, ZodType } from 'zod';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface ResponseContract {
  description: string;
  schema?: ZodType;
}

export interface RouteContract {
  method: HttpMethod;
  path: string;
  operationId: string;
  summary: string;
  tags: string[];
  auth?: boolean;
  request?: {
    params?: ZodObject;
    query?: ZodObject;
    body?: ZodType;
  };
  responses: Record<number, ResponseContract>;
}

export interface ContractRegistry {
  registerRoute(route: RouteContract): void;
}
