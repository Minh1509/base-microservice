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

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { status, body } = this.toResponse(exception, req.url);

    if (status >= 500) {
      this.logger.error(
        `[${body.code}] ${body.message} (${req.method} ${req.url})`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${body.code}] ${body.message} (${req.method} ${req.url})`);
    }

    res.status(status).json(body);
  }

  private toResponse(
    exception: unknown,
    path: string,
  ): { status: number; body: HttpErrorResponse } {
    const timestamp = new Date().toISOString();

    if (exception instanceof UnprocessableEntityException) {
      const resp = exception.getResponse();
      const details = this.extractValidationMessages(resp);
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        body: {
          code: 'VALIDATION_FAILED',
          message: 'Request validation failed',
          details,
          timestamp,
          path,
        },
      };
    }

    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      const status = exception.getStatus();

      // Body đã có shape { code, message, details? } từ sendRpc → giữ nguyên.
      if (this.hasCodeShape(resp)) {
        return {
          status,
          body: {
            code: resp.code,
            message: resp.message,
            details: resp.details,
            timestamp,
            path,
          },
        };
      }

      const message =
        typeof resp === 'string'
          ? resp
          : ((resp as { message?: string }).message ?? exception.message);

      return {
        status,
        body: {
          code: this.statusToCode(status),
          message,
          timestamp,
          path,
        },
      };
    }

    const err = exception as Error;
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: 'INTERNAL_ERROR',
        message: err?.message ?? 'Internal error',
        timestamp,
        path,
      },
    };
  }

  private hasCodeShape(
    resp: unknown,
  ): resp is { code: string; message: string; details?: unknown } {
    if (typeof resp !== 'object' || resp === null) return false;
    const v = resp as Record<string, unknown>;
    return typeof v.code === 'string' && typeof v.message === 'string';
  }

  private extractValidationMessages(resp: unknown): string[] {
    if (typeof resp === 'object' && resp !== null) {
      const msg = (resp as { message?: unknown }).message;
      if (Array.isArray(msg)) return msg as string[];
      if (typeof msg === 'string') return [msg];
    }
    return ['Invalid payload'];
  }

  private statusToCode(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_FAILED';
      case 504:
        return 'UPSTREAM_TIMEOUT';
      default:
        return status >= 500 ? 'INTERNAL_ERROR' : 'CLIENT_ERROR';
    }
  }
}
