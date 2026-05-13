import * as _chalk from 'chalk';
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

const chalk = (_chalk as any).default ?? _chalk;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url, body } = req;
    const start = Date.now();
    const bodySize = body ? Buffer.byteLength(JSON.stringify(body)) : 0;
    const sizeLabel = bodySize > 0 ? ` [${formatSize(bodySize)}]` : '';

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        const status = res.statusCode;
        const coloredStatus = status >= 400 ? chalk.red(status) : chalk.green(status);
        this.logger.log(
          `[${method}] ${url}${sizeLabel} → ${coloredStatus} (${Date.now() - start}ms)`,
        );
      }),
      catchError((err: unknown) => {
        const status =
          err instanceof HttpException
            ? err.getStatus()
            : (err as any)?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;

        this.logger.log(
          `[${method}] ${url}${sizeLabel} → ${chalk.red(status)} (${Date.now() - start}ms)`,
        );
        throw err;
      }),
    );
  }
}
