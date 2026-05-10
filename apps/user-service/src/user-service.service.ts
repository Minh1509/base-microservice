import { appConfig } from '@app/config';
import { PingUserDto } from '@app/dto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class UserServiceService {
  constructor(
    @Inject(appConfig.KEY)
    private readonly app: ConfigType<typeof appConfig>,
  ) {}

  ping(payload: PingUserDto) {
    return {
      service: 'user-service',
      env: this.app.env,
      echo: payload ?? null,
      ts: new Date().toISOString(),
    };
  }
}
