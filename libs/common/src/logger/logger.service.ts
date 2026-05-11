import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AppLogger implements LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  child(context: string): Logger;
  child(meta: Record<string, unknown>): Logger;
  child(contextOrMeta: string | Record<string, unknown>): Logger {
    const meta =
      typeof contextOrMeta === 'string' ? { context: contextOrMeta } : contextOrMeta;
    return this.logger.child(meta);
  }

  log(message: string, meta?: Record<string, unknown>) {
    this.logger.info(message, meta);
  }

  error(message: string, trace?: string, meta?: Record<string, unknown>) {
    this.logger.error(message, {
      trace,
      ...meta,
    });
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug(message, meta);
  }

  verbose(message: string, meta?: Record<string, unknown>) {
    this.logger.verbose(message, meta);
  }
}
