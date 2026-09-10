import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import type { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { HttpErrorResponse } from './http-error';
import { isRpcErrorPayload, RpcErrorPayload } from './rpc-error';
import { statusToCode } from './status-code.map';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: unknown, _host: ArgumentsHost): Observable<never> {
    const payload = this.buildPayload(exception);

    const logMessage = `[${payload.statusCode}] ${payload.details ?? payload.message}`;
    if (payload.statusCode >= 500) {
      this.logger.error(
        logMessage,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    if (_host.getType() === 'http') {
      const ctx = _host.switchToHttp();
      const req = ctx.getRequest<Request>();
      const res = ctx.getResponse<Response>();

      const body: HttpErrorResponse = {
        ...payload,
        timestamp: new Date().toISOString(),
        path: req?.url,
      };

      res.status(payload.statusCode).json(body);
      return;
    }

    return throwError(() => new RpcException(payload));
  }

  private buildPayload(exception: unknown): RpcErrorPayload {
    if (exception instanceof RpcException) {
      const error = exception.getError();
      if (isRpcErrorPayload(error)) {
        return error;
      }
      return {
        statusCode: 500,
        errorCode: 'RPC_ERROR',
        message: typeof error === 'string' ? error : 'Unknown RPC error',
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse() as any;

      return {
        statusCode,
        errorCode: response?.errorCode ?? statusToCode(statusCode),
        message: response?.message ?? exception.message,
        details: response?.details,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: exception instanceof Error ? exception.message : 'Internal error',
    };
  }
}
