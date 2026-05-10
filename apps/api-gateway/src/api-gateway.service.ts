import {
  ALL_AUTH_PATTERNS,
  ALL_USER_PATTERNS,
  AUTH_PATTERNS,
  sendRpc,
  USER_PATTERNS,
} from '@app/common';
import {
  PingAuthDto,
  PingAuthResponseDto,
  PingUserDto,
  PingUserResponseDto,
} from '@app/dto';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { AUTH_SERVICE, USER_SERVICE } from './api-gateway.module';

@Injectable()
export class ApiGatewayService implements OnModuleInit {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authClient: ClientKafka,
    @Inject(USER_SERVICE) private readonly userClient: ClientKafka,
  ) {}

  async onModuleInit() {
    ALL_AUTH_PATTERNS.forEach((p) => this.authClient.subscribeToResponseOf(p));
    ALL_USER_PATTERNS.forEach((p) => this.userClient.subscribeToResponseOf(p));
    await this.authClient.connect();
    await this.userClient.connect();
  }

  pingAuth(payload: PingAuthDto): Promise<PingAuthResponseDto> {
    return sendRpc<PingAuthResponseDto>(this.authClient, AUTH_PATTERNS.PING, payload);
  }

  pingUser(payload: PingUserDto): Promise<PingUserResponseDto> {
    return sendRpc<PingUserResponseDto>(this.userClient, USER_PATTERNS.PING, payload);
  }
}
