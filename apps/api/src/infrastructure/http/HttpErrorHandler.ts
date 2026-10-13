import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ErrorResponseDto } from '#core/contracts/ErrorResponse';
import { ApplicationError } from '#core/errors/ApplicationError';
import type { AppLogger } from '#core/logging/AppLogger';
import { HttpView } from '#core/view/HttpView';
import { ExpressResponderAdapter } from './ExpressResponderAdapter';

class ErrorHttpView extends HttpView<never> {}

/**
 * Last line of defence. Known `ApplicationError`s (e.g. a `ValidationError` thrown by a
 * view's input parsing) are rendered like any presenter error; everything else is logged
 * and answered with an opaque 500.
 */
export class HttpErrorHandler {
  constructor(private readonly logger: AppLogger) {}

  readonly notFound: RequestHandler = (req, res) => {
    const body: ErrorResponseDto = {
      error: { code: 'ROUTE_NOT_FOUND', message: `Cannot ${req.method} ${req.originalUrl}` },
    };
    res.status(404).json(body);
  };

  readonly handle: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    if (error instanceof ApplicationError) {
      new ErrorHttpView(new ExpressResponderAdapter(res)).renderError({
        kind: error.kind,
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return;
    }

    if (error instanceof SyntaxError && 'body' in error) {
      const body: ErrorResponseDto = {
        error: { code: 'MALFORMED_JSON', message: 'Request body is not valid JSON' },
      };
      res.status(400).json(body);
      return;
    }

    this.logger.error('Unhandled error', { err: error });
    const body: ErrorResponseDto = {
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
    };
    res.status(500).json(body);
  };
}
