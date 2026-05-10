import {
  GatewayTimeoutException,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, TimeoutError } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { isRpcErrorPayload, RPC_DEFAULT_TIMEOUT_MS } from './rpc-error';

export interface SendRpcOptions {
  timeoutMs?: number;
}

const logger = new Logger('RpcClient');

export async function sendRpc<TRes>(
  client: ClientProxy,
  pattern: string,
  payload: unknown,
  opts: SendRpcOptions = {},
): Promise<TRes> {
  const timeoutMs = opts.timeoutMs ?? RPC_DEFAULT_TIMEOUT_MS;

  try {
    return await firstValueFrom(
      client.send<TRes>(pattern, payload ?? {}).pipe(timeout({ each: timeoutMs })),
    );
  } catch (err) {
    throw mapRpcErrorToHttp(err, pattern, timeoutMs);
  }
}

function mapRpcErrorToHttp(
  err: unknown,
  pattern: string,
  timeoutMs: number,
): HttpException {
  if (err instanceof TimeoutError) {
    logger.warn(`Upstream ${pattern} timed out after ${timeoutMs}ms`);
    return new GatewayTimeoutException({
      code: 'UPSTREAM_TIMEOUT',
      message: `Upstream ${pattern} timed out`,
    });
  }

  if (isRpcErrorPayload(err)) {
    return new HttpException(
      { code: err.code, message: err.message, details: err.details },
      err.status,
    );
  }

  // Nest wraps RpcException error into the `err` value directly; also
  // handle wrapped { status, code, message } nested inside `err.error`.
  if (typeof err === 'object' && err !== null) {
    const wrapped = (err as Record<string, unknown>).error;
    if (isRpcErrorPayload(wrapped)) {
      return new HttpException(
        {
          code: wrapped.code,
          message: wrapped.message,
          details: wrapped.details,
        },
        wrapped.status,
      );
    }
  }

  logger.error(
    `Unhandled upstream error on ${pattern}`,
    err instanceof Error ? err.stack : String(err),
  );
  return new InternalServerErrorException({
    code: 'UPSTREAM_ERROR',
    message: `Upstream ${pattern} failed`,
  });
}
