import { appConfig, buildConfigModule, kafkaConfig } from '@app/config';
import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';

export const AUTH_SERVICE = 'AUTH_SERVICE';
export const USER_SERVICE = 'USER_SERVICE';

@Module({
  imports: [
    buildConfigModule({
      load: [appConfig, kafkaConfig],
      envFilePath: ['apps/api-gateway/.env', '.env.shared'],
    }),
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        inject: [kafkaConfig.KEY],
        useFactory: (kafka: ConfigType<typeof kafkaConfig>) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: kafka.brokers,
              clientId: `${kafka.clientId}-auth-client`,
            },
            consumer: { groupId: `${kafka.groupId}-auth` },
          },
        }),
      },
      {
        name: USER_SERVICE,
        inject: [kafkaConfig.KEY],
        useFactory: (kafka: ConfigType<typeof kafkaConfig>) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: kafka.brokers,
              clientId: `${kafka.clientId}-user-client`,
            },
            consumer: { groupId: `${kafka.groupId}-user` },
          },
        }),
      },
    ]),
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {}
