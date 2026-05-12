import { PayloadValidationPipe, RpcExceptionFilter } from '@app/common';
import { kafkaConfig } from '@app/config';
import { buildWinstonOptions } from '@app/logger';
import { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { WinstonModule } from 'nest-winston';
import { UserServiceModule } from './user-service.module';

async function bootstrap() {
  const logger = WinstonModule.createLogger(
    buildWinstonOptions({ serviceName: 'user-service' }),
  );

  const ctx = await NestFactory.createApplicationContext(UserServiceModule, {
    logger,
  });
  const kafka = ctx.get<ConfigType<typeof kafkaConfig>>(kafkaConfig.KEY);
  await ctx.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserServiceModule,
    {
      logger,
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: kafka.brokers,
          clientId: kafka.clientId,
          retry: {
            initialRetryTime: 1000,
            retries: 10,
          },
        },
        consumer: { groupId: kafka.groupId },
      },
    },
  );

  app.useGlobalPipes(new PayloadValidationPipe());
  app.useGlobalFilters(new RpcExceptionFilter());

  await app.listen();
}
void bootstrap();
