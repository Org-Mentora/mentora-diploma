import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  type ResponseConfig,
  type RouteConfig,
} from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import { ErrorResponseSchema } from '#core/contracts/ErrorResponse';
import type { ContractRegistry, RouteContract } from '#core/module/ContractRegistry';
import { SESSION_COOKIE_NAME } from '#infrastructure/http/SessionCookie';

function json(schema: ZodType) {
  return { 'application/json': { schema } };
}

type OpenApiDocument = ReturnType<OpenApiGeneratorV31['generateDocument']>;

/**
 * Singleton (ADR-0006) + Adapter (ADR-0007): collects every module's `RouteContract`s and
 * translates them to `@asteasolutions/zod-to-openapi`. Schemas become components through
 * their `.meta({ id })`, so there is no separate schema registration. The generator produces
 * the Swagger document served at `/api/docs` and consumed by the frontend codegen (ADR-0009, ADR-0010).
 */
export class OpenApiRegistry implements ContractRegistry {
  static #instance: OpenApiRegistry | undefined;

  #registry = new OpenAPIRegistry();

  private constructor() {
    this.#registry.registerComponent('securitySchemes', 'cookieAuth', {
      type: 'apiKey',
      in: 'cookie',
      name: SESSION_COOKIE_NAME,
      description: 'Session cookie set by POST /auth/login and POST /auth/register',
    });
  }

  static getInstance(): OpenApiRegistry {
    OpenApiRegistry.#instance ??= new OpenApiRegistry();
    return OpenApiRegistry.#instance;
  }

  static resetInstance(): void {
    OpenApiRegistry.#instance = undefined;
  }

  registerRoute(route: RouteContract): void {
    this.#registry.registerPath(this.toRouteConfig(route));
  }

  generateDocument(version: string): OpenApiDocument {
    return new OpenApiGeneratorV31(this.#registry.definitions).generateDocument({
      openapi: '3.1.0',
      info: {
        title: 'Mentora API',
        version,
        description: 'REST API of the Mentora platform. Generated from zod contracts.',
      },
      servers: [{ url: '/api' }],
    });
  }

  private toRouteConfig(route: RouteContract): RouteConfig {
    const responses: Record<number, ResponseConfig> = {};
    for (const [status, response] of Object.entries(route.responses)) {
      responses[Number(status)] = {
        description: response.description,
        ...(response.schema ? { content: json(response.schema) } : {}),
      };
    }

    if (route.auth) {
      responses[401] ??= {
        description: 'Missing or invalid session',
        content: json(ErrorResponseSchema),
      };
      responses[403] ??= {
        description: 'Subscription inactive',
        content: json(ErrorResponseSchema),
      };
    }

    const { params, query, body } = route.request ?? {};
    return {
      method: route.method,
      path: route.path,
      operationId: route.operationId,
      summary: route.summary,
      tags: route.tags,
      ...(route.auth ? { security: [{ cookieAuth: [] }] } : {}),
      request: {
        ...(params ? { params } : {}),
        ...(query ? { query } : {}),
        ...(body ? { body: { content: { 'application/json': { schema: body } } } } : {}),
      },
      responses,
    };
  }
}
