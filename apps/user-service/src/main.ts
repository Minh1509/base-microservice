import {
  PayloadValidationPipe,
  RpcExceptionFilter,
  RpcLoggingInterceptor,
  setupSwagger,
} from '@app/common';
import { appConfig, kafkaConfig } from '@app/config';
import { buildWinstonOptions } from '@app/core/logger';
import { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WinstonModule } from 'nest-winston';
import { UserServiceModule } from './user-service.module';

async function bootstrap() {
  const ctx = await NestFactory.createApplicationContext(UserServiceModule);
  const appCfg = ctx.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const kafka = ctx.get<ConfigType<typeof kafkaConfig>>(kafkaConfig.KEY);
  await ctx.close();

  const logger = WinstonModule.createLogger(
    buildWinstonOptions({ serviceName: appCfg.serviceName }),
  );
  const app = await NestFactory.create<NestExpressApplication>(UserServiceModule, {
    logger,
  });
  const isProduction = appCfg.env === 'production';

  app.enableCors({ origin: '*' });
  app.set('trust proxy', appCfg.trustProxy);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: kafka.brokers,
        clientId: kafka.clientId,
        retry: {
          initialRetryTime: 2000,
          retries: 10,
        },
      },
      consumer: { groupId: kafka.groupId },
    },
  });

  app.useGlobalPipes(new PayloadValidationPipe());
  app.useGlobalFilters(new RpcExceptionFilter());
  app.useGlobalInterceptors(new RpcLoggingInterceptor());

  if (!isProduction) {
    setupSwagger(app);
  }

  await app.startAllMicroservices();
  await app.listen(appCfg.port);

  logger.log({
    message: `${appCfg.serviceName} is listening at ${!isProduction ? `Swagger: http://localhost:${appCfg.port}/swagger` : ''}, Kafka connected}`,
    context: 'Application',
  });
}
void bootstrap();
