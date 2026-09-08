import { appConfig } from '@app/config';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { buildWinstonOptions } from './logger.config';
import { AppLogger } from './logger.service';

@Global()
@Module({})
export class LoggerModule {
  static forRoot(): DynamicModule {
    return {
      module: LoggerModule,
      global: true,
      imports: [
        WinstonModule.forRootAsync({
          inject: [appConfig.KEY],
          useFactory: (app: ConfigType<typeof appConfig>) =>
            buildWinstonOptions({ serviceName: app.serviceName }),
        }),
      ],
      providers: [AppLogger],
      exports: [AppLogger],
    };
  }
}
