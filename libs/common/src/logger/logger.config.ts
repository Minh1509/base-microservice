import * as winston from 'winston';
import { utilities as nestWinstonUtilities } from 'nest-winston';

export interface BuildWinstonOptions {
  serviceName: string;
}

export function buildWinstonOptions({
  serviceName,
}: BuildWinstonOptions): winston.LoggerOptions {
  const isProd = process.env.NODE_ENV === 'production';
  const level = process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug');

  const format = isProd
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      )
    : winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
        winston.format.ms(),
        winston.format.errors({ stack: true }),
        nestWinstonUtilities.format.nestLike(serviceName, {
          colors: true,
          prettyPrint: true,
        }),
      );

  return {
    level,
    defaultMeta: { service: serviceName },
    format,
    transports: [new winston.transports.Console()],
  };
}
