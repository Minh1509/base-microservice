import {
  ALL_AUTH_PATTERNS,
  ALL_USER_PATTERNS,
  AppLogger,
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
import { Logger } from 'winston';
import { AUTH_SERVICE, USER_SERVICE } from './api-gateway.module';

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
    this.logger.debug('Initializing API Gateway service');
    ALL_AUTH_PATTERNS.forEach((p) => this.authClient.subscribeToResponseOf(p));
    ALL_USER_PATTERNS.forEach((p) => this.userClient.subscribeToResponseOf(p));
    await this.authClient.connect();
    await this.userClient.connect();
    this.logger.info('API Gateway service initialized');
  }

  pingAuth(payload: PingAuthDto): Promise<PingAuthResponseDto> {
    this.logger.debug('Calling auth service ping', { payload });
    return sendRpc<PingAuthResponseDto>(this.authClient, AUTH_PATTERNS.PING, payload);
  }

  pingUser(payload: PingUserDto): Promise<PingUserResponseDto> {
    this.logger.debug('Calling user service ping', { payload });
    return sendRpc<PingUserResponseDto>(this.userClient, USER_PATTERNS.PING, payload);
  }
}
