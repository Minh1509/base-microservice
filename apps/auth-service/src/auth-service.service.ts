import { appConfig } from '@app/config';
import { PingAuthDto } from '@app/dto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class AuthServiceService {
  constructor(
    @Inject(appConfig.KEY)
    private readonly app: ConfigType<typeof appConfig>,
  ) {}

  ping(payload: PingAuthDto) {
    return {
      service: 'auth-service',
      env: this.app.env,
      echo: payload ?? null,
      ts: new Date().toISOString(),
    };
  }
}
