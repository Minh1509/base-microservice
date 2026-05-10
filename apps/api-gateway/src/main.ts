import { buildWinstonOptions, GlobalHttpExceptionFilter } from '@app/common';
import { appConfig } from '@app/config';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const logger = WinstonModule.createLogger(
    buildWinstonOptions({ serviceName: 'api-gateway' }),
  );

  const app = await NestFactory.create(ApiGatewayModule, { logger });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  const cfg = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  await app.listen(cfg.port);
}
void bootstrap();
