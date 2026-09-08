import {
  GlobalHttpExceptionFilter,
  LoggingInterceptor,
  PayloadValidationPipe,
  setupSwagger,
} from '@app/common';
import { appConfig } from '@app/config';
import { buildWinstonOptions } from '@app/core/logger';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const logger = WinstonModule.createLogger(
    buildWinstonOptions({ serviceName: 'api-gateway' }),
  );

  const app = await NestFactory.create<NestExpressApplication>(ApiGatewayModule, {
    logger,
  });

  const cfg = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const isProduction = cfg.env === 'production';

  app.enableCors({ origin: '*' });
  app.set('trust proxy', cfg.trustProxy);
  app.use(helmet());

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 500,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalPipes(new PayloadValidationPipe());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ClassSerializerInterceptor(reflector),
  );
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  setupSwagger(app);
  await app.listen(cfg.port);

  if (!isProduction) {
    logger.log({
      message: `Application ready. Swagger at http://localhost:${cfg.port}/swagger`,
      context: 'Application',
    });
  }
}
void bootstrap();
