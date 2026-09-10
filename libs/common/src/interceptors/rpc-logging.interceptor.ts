import * as _chalk from 'chalk';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { KafkaContext } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

const chalk = (_chalk as any).default ?? _chalk;

function formatSize(payload: unknown): string {
  const bytes = payload ? Buffer.byteLength(JSON.stringify(payload)) : 0;
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

@Injectable()
export class RpcLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RpcLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isHttp = context.getType() === 'http';
    const http = context.switchToHttp();
    const rpc = context.switchToRpc();

    const [action, payload] = isHttp
      ? [`[${http.getRequest().method}] ${http.getRequest().url}`, http.getRequest().body]
      : [
          `[RPC] ${rpc.getContext<KafkaContext>()?.getTopic?.() ?? context.getHandler().name}`,
          rpc.getData(),
        ];

    const label = `${action} [${formatSize(payload)}]`;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const status = isHttp ? http.getResponse().statusCode : 200;
        const color = status >= 400 ? chalk.red : chalk.green;
        this.logger.log(`${label} → ${color(status)} (${Date.now() - start}ms)`);
      }),
      catchError((err: any) => {
        const status = err?.getStatus?.() ?? err?.statusCode ?? 500;
        this.logger.log(`${label} → ${chalk.red(status)} (${Date.now() - start}ms)`);
        return throwError(() => err);
      }),
    );
  }
}
