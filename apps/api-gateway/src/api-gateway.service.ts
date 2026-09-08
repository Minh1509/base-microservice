import {
  ALL_AUTH_PATTERNS,
  ALL_USER_PATTERNS,
  AUTH_PATTERNS,
  LoginDto,
  LoginResponseDto,
  PingAuthDto,
  PingAuthResponseDto,
  PingUserDto,
  PingUserResponseDto,
  USER_PATTERNS,
} from '@app/contracts';
import { AppLogger } from '@app/core/logger';
import { AUTH_SERVICE, sendRpc, USER_SERVICE } from '@app/core/queue';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Logger } from 'winston';

@Injectable()
export class ApiGatewayService implements OnModuleInit {
  private logger!: Logger;

  constructor(
    @Inject(AUTH_SERVICE) private readonly authClient: ClientKafka,
    @Inject(USER_SERVICE) private readonly userClient: ClientKafka,
    private readonly appLogger: AppLogger,
  ) {
    this.logger = this.appLogger.child({ context: ApiGatewayService.name });
  }

  async onModuleInit() {
    ALL_AUTH_PATTERNS.forEach((p) => this.authClient.subscribeToResponseOf(p));
    ALL_USER_PATTERNS.forEach((p) => this.userClient.subscribeToResponseOf(p));
    await this.authClient.connect();
    await this.userClient.connect();
    this.logger.info('API Gateway initialized');
  }

  pingAuth(payload: PingAuthDto): Promise<PingAuthResponseDto> {
    return sendRpc<PingAuthResponseDto>(this.authClient, AUTH_PATTERNS.PING, payload);
  }

  login(payload: LoginDto): Promise<LoginResponseDto> {
    return sendRpc<LoginResponseDto>(this.authClient, AUTH_PATTERNS.LOGIN, payload);
  }

  pingUser(payload: PingUserDto): Promise<PingUserResponseDto> {
    return sendRpc<PingUserResponseDto>(this.userClient, USER_PATTERNS.PING, payload);
  }
}
