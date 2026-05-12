import {
  appConfig,
  buildConfigModule,
  databaseConfig,
  jwtConfig,
  kafkaConfig,
} from '@app/config';
import { DatabaseModule } from '@app/database';
import { LoggerModule } from '@app/logger';
import { Module } from '@nestjs/common';
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';
import { CommandModule } from '../commands';

@Module({
  imports: [
    buildConfigModule({
      load: [appConfig, databaseConfig, kafkaConfig, jwtConfig],
      envFilePath: ['apps/auth-service/.env', '.env.shared'],
    }),
    DatabaseModule,
    CommandModule,
    LoggerModule.forRoot(),
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
})
export class AuthServiceModule {}
