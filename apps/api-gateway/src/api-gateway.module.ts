import { appConfig, buildConfigModule, kafkaConfig } from '@app/config';
import { LoggerModule } from '@app/core/logger';
import { AUTH_SERVICE, KafkaModule, USER_SERVICE } from '@app/core/queue';
import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';

@Module({
  imports: [
    buildConfigModule({
      load: [appConfig, kafkaConfig],
      envFilePath: ['apps/api-gateway/.env', '.env.shared'],
    }),
    KafkaModule.register({
      clients: [
        { name: AUTH_SERVICE, groupSuffix: 'auth' },
        { name: USER_SERVICE, groupSuffix: 'user' },
      ],
    }),
    LoggerModule.forRoot(),
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {}
