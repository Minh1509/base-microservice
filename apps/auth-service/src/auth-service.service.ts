import { appConfig } from '@app/config';
import { AppLogger } from '@app/logger';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { Logger } from 'winston';
import { LoginDto, PingAuthDto } from './dto';

@Injectable()
export class AuthServiceService {
  private logger!: Logger;

  constructor(
    @Inject(appConfig.KEY)
    private readonly app: ConfigType<typeof appConfig>,
    private readonly appLogger: AppLogger,
  ) {
    this.logger = this.appLogger.child({ context: AuthServiceService.name });
  }

  ping(payload: PingAuthDto) {
    this.logger.info('Ping received', { payload });
    return {
      service: 'auth-service',
      env: this.app.env,
      echo: payload ?? null,
      ts: new Date().toISOString(),
    };
  }

  login(payload: LoginDto) {
    this.logger.info('Login attempt', { email: payload.email });

    if (payload.email !== 'admin@local.dev' || payload.password !== 'password123') {
      throw new RpcException({
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect',
      });
    }

    return { accessToken: 'fake-jwt-token-for-demo' };
  }
}
