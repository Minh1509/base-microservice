import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { isRpcErrorPayload, RpcErrorPayload } from './rpc-error';
import { statusToCode } from '../http/status-code.map';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: unknown, _host: ArgumentsHost): Observable<never> {
    const payload = this.toPayload(exception);

    if (payload.status >= 500) {
      this.logger.error(
        `[${payload.code}] ${payload.message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${payload.code}] ${payload.message}`);
    }

    return throwError(() => new RpcException(payload));
  }

  private toPayload(exception: unknown): RpcErrorPayload {
    if (exception instanceof RpcException) {
      const err = exception.getError();
      if (isRpcErrorPayload(err)) return err;
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'RPC_ERROR',
        message: typeof err === 'string' ? err : 'Unknown RPC error',
      };
    }

    if (
      exception instanceof UnprocessableEntityException ||
      exception instanceof BadRequestException
    ) {
      const resp = exception.getResponse() as Record<string, unknown>;
      const msg = resp.message;
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed',
        details: Array.isArray(msg)
          ? msg
          : [typeof msg === 'string' ? msg : 'Invalid payload'],
      };
    }

    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      const r =
        typeof resp === 'object' && resp !== null
          ? (resp as Record<string, unknown>)
          : null;
      const message =
        typeof resp === 'string'
          ? resp
          : r && typeof r.message === 'string'
            ? r.message
            : exception.message;
      return {
        status: exception.getStatus(),
        code: statusToCode(exception.getStatus()),
        message,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: exception instanceof Error ? exception.message : 'Internal error',
    };
  }
}
