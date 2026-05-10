import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  serviceName: process.env.SERVICE_NAME ?? 'app',
}));

export type AppConfig = ReturnType<typeof appConfig>;
