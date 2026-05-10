import { buildWinstonOptions, RpcExceptionFilter } from '@app/common';
import { kafkaConfig } from '@app/config';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { WinstonModule } from 'nest-winston';
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
  const logger = WinstonModule.createLogger(
    buildWinstonOptions({ serviceName: 'auth-service' }),
  );

  const ctx = await NestFactory.createApplicationContext(AuthServiceModule, {
    logger,
  });
  const kafka = ctx.get<ConfigType<typeof kafkaConfig>>(kafkaConfig.KEY);
  await ctx.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthServiceModule,
    {
      logger,
      transport: Transport.KAFKA,
      options: {
        client: { brokers: kafka.brokers, clientId: kafka.clientId },
        consumer: { groupId: kafka.groupId },
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );
  app.useGlobalFilters(new RpcExceptionFilter());

  await app.listen();
}
void bootstrap();
