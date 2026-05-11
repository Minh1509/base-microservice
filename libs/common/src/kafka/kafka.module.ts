import { kafkaConfig } from '@app/config';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  ClientsModule,
  ClientsProviderAsyncOptions,
  KafkaOptions,
  Transport,
} from '@nestjs/microservices';

export interface KafkaClientDefinition {
  name: string;
  groupSuffix: string;
}

export interface KafkaModuleOptions {
  clients: KafkaClientDefinition[];
}

@Module({})
export class KafkaModule {
  static register(options: KafkaModuleOptions): DynamicModule {
    const clientProviders: ClientsProviderAsyncOptions[] = options.clients.map((def) => ({
      name: def.name,
      inject: [kafkaConfig.KEY],
      useFactory: (kafka: ConfigType<typeof kafkaConfig>): KafkaOptions => ({
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: kafka.brokers,
            clientId: `${kafka.clientId}-${def.groupSuffix}-client`,
          },
          consumer: { groupId: `${kafka.groupId}-${def.groupSuffix}` },
        },
      }),
    }));

    return {
      module: KafkaModule,
      imports: [ClientsModule.registerAsync(clientProviders)],
      exports: [ClientsModule],
    };
  }
}
