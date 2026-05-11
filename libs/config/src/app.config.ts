import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  serviceName: process.env.SERVICE_NAME ?? 'app',
  rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
  trustProxy: parseInt(process.env.TRUST_PROXY ?? '1', 10),
}));

export type AppConfig = ReturnType<typeof appConfig>;
