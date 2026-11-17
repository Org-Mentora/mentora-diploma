import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ErrorResponseDto } from '#core/contracts/ErrorResponse';
import { ApplicationError } from '#core/errors/ApplicationError';
import type { AppLogger } from '#core/logging/AppLogger';
import { HttpView } from '#core/view/HttpView';
import { ExpressResponderAdapter } from './ExpressResponderAdapter';

// Passive View
class ErrorHttpView extends HttpView<never> {}

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

    const clientStatus = HttpErrorHandler.clientStatusOf(error);
    if (clientStatus) {
      const body: ErrorResponseDto = {
        error: {
          code: clientStatus === 413 ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST',
          message: clientStatus === 413 ? 'Request body is too large' : 'Request was rejected',
        },
      };
      res.status(clientStatus).json(body);
      return;
    }

    this.logger.error('Unhandled error', { err: error });
    const body: ErrorResponseDto = {
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
    };
    res.status(500).json(body);
  };

  private static clientStatusOf(error: unknown): number | null {
    const { status, expose } = (error ?? {}) as { status?: unknown; expose?: unknown };
    return expose === true && typeof status === 'number' && status >= 400 && status < 500
      ? status
      : null;
  }
}
