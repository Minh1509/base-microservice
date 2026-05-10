import { AppLogger } from '@app/common';
import { appConfig } from '@app/config';
import { PingAuthDto } from '@app/dto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Logger } from 'winston';

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
}
