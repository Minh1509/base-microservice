import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { HttpErrorResponse } from './http-error';
import { statusToCode } from './status-code.map';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { status, body } = this.buildResponse(exception, req.url);
    const logMessage = `[${body.statusCode}] ${body.message}`;
    if (status >= 500) {
      this.logger.error(logMessage, exception instanceof Error ? exception.stack : '');
    }
    res.status(status).json(body);
  }

  private buildResponse(
    exception: unknown,
    path: string,
  ): {
    status: number;
    body: HttpErrorResponse;
  } {
    const timestamp = new Date().toISOString();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse() as any;

      return {
        status,
        body: {
          statusCode: status,
          timestamp,
          path,
          errorCode: response?.errorCode ?? statusToCode(status),
          message: response?.message ?? exception.message,
          details: response?.details,
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        statusCode: 500,
        timestamp,
        path,
        errorCode: 'INTERNAL_SERVER_ERROR',
        message: exception instanceof Error ? exception.message : 'Internal server error',
      },
    };
  }
}
