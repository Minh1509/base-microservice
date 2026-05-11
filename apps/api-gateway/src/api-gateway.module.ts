import { AUTH_SERVICE, KafkaModule, USER_SERVICE } from '@app/common';
import { appConfig, buildConfigModule, kafkaConfig } from '@app/config';
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
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {}
