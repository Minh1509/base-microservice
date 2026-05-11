import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { HttpErrorResponse } from './http-error';
import { statusToCode } from './status-code.map';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const timestamp = new Date().toISOString();
    const path = req.url;

    let status: number;
    let body: HttpErrorResponse;

    if (exception instanceof UnprocessableEntityException) {
      const resp = exception.getResponse() as Record<string, unknown>;
      const msg = typeof resp === 'object' && resp ? resp.message : undefined;
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      body = {
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed',
        details: Array.isArray(msg)
          ? msg
          : [typeof msg === 'string' ? msg : 'Invalid payload'],
        timestamp,
        path,
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      const r =
        typeof resp === 'object' && resp !== null
          ? (resp as Record<string, unknown>)
          : null;
      const hasCode = r !== null && typeof r.code === 'string';

      if (hasCode && r) {
        body = {
          code: r.code as string,
          message: typeof r.message === 'string' ? r.message : exception.message,
          details: r.details,
          timestamp,
          path,
        };
      } else {
        const message =
          typeof resp === 'string'
            ? resp
            : r && typeof r.message === 'string'
              ? r.message
              : exception.message;
        body = { code: statusToCode(status), message, timestamp, path };
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = {
        code: 'INTERNAL_ERROR',
        message: exception instanceof Error ? exception.message : 'Internal error',
        timestamp,
        path,
      };
    }

    if (status >= 500) {
      this.logger.error(
        `[${body.code}] ${body.message} (${req.method} ${path})`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.error(`[${body.code}] ${body.message} (${req.method} ${path})`);
    }

    res.status(status).json(body);
  }
}
