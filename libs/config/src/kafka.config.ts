import { registerAs } from '@nestjs/config';

export const kafkaConfig = registerAs('kafka', () => ({
  brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9094')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean),
  clientId: process.env.KAFKA_CLIENT_ID ?? 'nest-service',
  groupId: process.env.KAFKA_GROUP_ID ?? 'nest-consumer',
}));

export type KafkaConfig = ReturnType<typeof kafkaConfig>;
