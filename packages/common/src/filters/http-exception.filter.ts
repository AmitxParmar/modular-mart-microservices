import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/nestjs';

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  correlationId?: string;
}

/**
 * Shared global HTTP exception filter.
 * Formats ALL exceptions into a consistent JSON shape and logs them via pino.
 * Import this from @repo/common and register globally in every service.
 *
 * Uses NestJS's built-in Logger (which nestjs-pino replaces with pino under the hood)
 * to avoid cross-package class-identity issues with PinoLogger.
 */
@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

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
      exception instanceof HttpException ? exception.name : 'InternalServerError';

    const correlationId = request.headers['x-request-id'] as string | undefined;

    const body: ErrorResponse = {
      statusCode,
      message,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(correlationId && { correlationId }),
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );

      // Capture error in Sentry
      Sentry.captureException(exception);
    } else {
      this.logger.warn(
        `Client error ${statusCode} on ${request.method} ${request.url}`,
      );
    }

    response.status(statusCode).json(body);
  }
}
