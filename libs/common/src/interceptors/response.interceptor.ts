import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TransformResponse<T> {
  data: T;
}

/**
 * Wraps response payload in { data } envelope.
 * Not registered globally — apply per-controller or per-route with @UseInterceptors().
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, TransformResponse<T>> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<TransformResponse<T>> {
    return next.handle().pipe(map((data) => ({ data })));
  }
}
