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

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        this.logger.log(
          `[${method}] ${url} → ${res.statusCode} (${Date.now() - start}ms)`,
        );
      }),
      catchError((err: unknown) => {
        const statusCode =
          err instanceof HttpException
            ? err.getStatus()
            : (err as any)?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;

        this.logger.error(`[${method}] ${url} → ${statusCode} (${Date.now() - start}ms)`);
        throw err;
      }),
    );
  }
}
