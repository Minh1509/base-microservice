import { appConfig } from '@app/config';
import { DynamicModule } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { buildWinstonOptions } from './logger.config';

export class LoggerModule {
  static forRoot(): DynamicModule {
    return WinstonModule.forRootAsync({
      inject: [appConfig.KEY],
      useFactory: (app: ConfigType<typeof appConfig>) =>
        buildWinstonOptions({ serviceName: app.serviceName }),
    });
  }
}
