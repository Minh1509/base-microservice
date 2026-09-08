import { ClientKafka } from '@nestjs/microservices';

export function emitEvent(client: ClientKafka, pattern: string, payload: unknown): void {
  client.emit(pattern, payload ?? {});
}
