import type { ZodObject, ZodType } from 'zod';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface ResponseContract {
  description: string;
  schema?: ZodType;
}

/**
 * Framework-agnostic description of one endpoint. Modules declare their contracts with this
 * type; `OpenApiRegistry` adapts it to the OpenAPI generator (ADR-0007, ADR-0009).
 */
export interface RouteContract {
  method: HttpMethod;
  /** OpenAPI path relative to `/api`, using `{param}` placeholders. */
  path: string;
  operationId: string;
  summary: string;
  tags: string[];
  /** Requires the session cookie. Adds the security requirement and the 401/403 responses. */
  auth?: boolean;
  request?: {
    params?: ZodObject;
    query?: ZodObject;
    body?: ZodType;
  };
  responses: Record<number, ResponseContract>;
}

/**
 * Collects route contracts. DTO schemas must declare `.meta({ id: 'XxxDto' })`: that id becomes
 * the OpenAPI component name and the generated frontend type name.
 */
export interface ContractRegistry {
  registerRoute(route: RouteContract): void;
}
