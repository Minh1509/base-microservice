import { appConfig } from '@app/config';
import { AppLogger } from '@app/logger';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Logger } from 'winston';
import { PingUserDto } from './dto';

@Injectable()
export class UserServiceService {
  private logger!: Logger;

  constructor(
    @Inject(appConfig.KEY)
    private readonly app: ConfigType<typeof appConfig>,
    private readonly appLogger: AppLogger,
  ) {
    this.logger = this.appLogger.child({ context: UserServiceService.name });
  }

  ping(payload: PingUserDto) {
    this.logger.info('Ping received', { payload });
    return {
      service: 'user-service',
      env: this.app.env,
      echo: payload ?? null,
      ts: new Date().toISOString(),
    };
  }
}
