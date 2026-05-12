import { isRpcErrorPayload } from '@app/common';
import {
  GatewayTimeoutException,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, TimeoutError } from 'rxjs';
import { timeout } from 'rxjs/operators';

export interface SendRpcOptions {
  timeoutMs?: number;
}

const RPC_DEFAULT_TIMEOUT_MS = 5_000;
const logger = new Logger('KafkaClient');

export async function sendRpc<TRes>(
  client: ClientProxy,
  pattern: string,
  payload: unknown,
  opts: SendRpcOptions = {},
): Promise<TRes> {
  const ms = opts.timeoutMs ?? RPC_DEFAULT_TIMEOUT_MS;

  try {
    return await firstValueFrom(
      client.send<TRes>(pattern, payload ?? {}).pipe(timeout({ each: ms })),
    );
  } catch (err) {
    if (err instanceof TimeoutError) {
      logger.warn(`${pattern} timed out after ${ms}ms`);
      throw new GatewayTimeoutException({
        errorCode: 'UPSTREAM_TIMEOUT',
        message: `Upstream ${pattern} timed out`,
      });
    }

    if (isRpcErrorPayload(err)) {
      throw new HttpException(
        { errorCode: err.errorCode, message: err.message, details: err.details },
        err.statusCode,
      );
    }

    if (typeof err === 'object' && err !== null) {
      const wrapped = (err as Record<string, unknown>).error;
      if (isRpcErrorPayload(wrapped)) {
        throw new HttpException(
          {
            errorCode: wrapped.errorCode,
            message: wrapped.message,
            details: wrapped.details,
          },
          wrapped.statusCode,
        );
      }
    }

    logger.error(`Unhandled error on ${pattern}`, err instanceof Error ? err.stack : '');
    throw new InternalServerErrorException({
      errorCode: 'UPSTREAM_ERROR',
      message: `Upstream ${pattern} failed`,
    });
  }
}
