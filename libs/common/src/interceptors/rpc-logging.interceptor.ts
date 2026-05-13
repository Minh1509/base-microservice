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

@Injectable()
export class RpcLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RpcLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const rpcContext = context.switchToRpc().getContext<KafkaContext>();
    const pattern = rpcContext?.getTopic?.() ?? context.getHandler().name;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `[RPC] ${pattern} → ${chalk.green(200)} (${Date.now() - start}ms)`,
        );
      }),
      catchError((err: unknown) => {
        const status = (err as any)?.error?.statusCode ?? (err as any)?.statusCode ?? 500;
        this.logger.log(
          `[RPC] ${pattern} → ${chalk.red(status)} (${Date.now() - start}ms)`,
        );
        return throwError(() => err);
      }),
    );
  }
}
