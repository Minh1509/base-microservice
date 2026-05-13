import { appConfig, buildConfigModule, databaseConfig, kafkaConfig } from '@app/config';
import { DatabaseModule } from '@app/database';
import { LoggerModule } from '@app/logger';
import { Module } from '@nestjs/common';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';
import { CommandModule } from '../commands';

@Module({
  imports: [
    buildConfigModule({
      load: [appConfig, databaseConfig, kafkaConfig],
      envFilePath: ['apps/user-service/.env', '.env.shared'],
    }),
    DatabaseModule,
    CommandModule,
    LoggerModule.forRoot(),
  ],
  controllers: [UserServiceController],
  providers: [UserServiceService],
})
export class UserServiceModule {}
