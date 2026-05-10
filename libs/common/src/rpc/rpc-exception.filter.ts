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

    // ValidationPipe throw UnprocessableEntityException (gateway dùng 422),
    // nhưng ở microservice side default vẫn là BadRequestException nếu
    // chưa cấu hình. Map cả hai → 422 để nhất quán.
    if (
      exception instanceof UnprocessableEntityException ||
      exception instanceof BadRequestException
    ) {
      const resp = exception.getResponse();
      const messages = this.extractValidationMessages(resp);
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed',
        details: messages,
      };
    }

    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      const message =
        typeof resp === 'string'
          ? resp
          : (((resp as Record<string, unknown>).message as string) ?? exception.message);
      return {
        status: exception.getStatus(),
        code: this.statusToCode(exception.getStatus()),
        message,
      };
    }

    const err = exception as Error;
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: err?.message ?? 'Internal error',
    };
  }

  private extractValidationMessages(resp: unknown): string[] {
    if (typeof resp === 'object' && resp !== null) {
      const msg = (resp as Record<string, unknown>).message;
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
      default:
        return status >= 500 ? 'INTERNAL_ERROR' : 'CLIENT_ERROR';
    }
  }
}
