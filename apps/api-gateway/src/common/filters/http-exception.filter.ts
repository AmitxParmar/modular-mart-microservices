import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  /** Echo the correlation ID so clients can cross-reference logs */
  correlationId?: string;
}

/**
 * Global HTTP exception filter.
 * - Formats ALL exceptions into a consistent JSON shape
 * - Logs 5xx with full stack traces (Pino structured JSON)
 * - Logs 4xx as warnings (no stack trace spam)
 * - Includes correlationId in the response if set by CorrelationMiddleware
 */
@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(HttpExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? ((exception.getResponse() as { message?: string | string[] })
            ?.message ?? exception.message)
        : 'Internal server error';

    const errorName =
      exception instanceof HttpException
        ? exception.name
        : 'InternalServerError';

    const correlationId = request.headers['x-request-id'] as
      | string
      | undefined;

    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(correlationId && { correlationId }),
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        {
          method: request.method,
          url: request.url,
          statusCode,
          correlationId,
          err: exception instanceof Error ? exception : String(exception),
        },
        `Unhandled exception on ${request.method} ${request.url}`,
      );
    } else {
      this.logger.warn(
        { method: request.method, url: request.url, statusCode, correlationId },
        `Client error on ${request.method} ${request.url}`,
      );
    }

    response.status(statusCode).json(errorResponse);
  }
}
