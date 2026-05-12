import { appConfig, buildConfigModule, databaseConfig, kafkaConfig } from '@app/config';
import { LoggerModule } from '@app/logger';
import { Module } from '@nestjs/common';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';

@Module({
  imports: [
    buildConfigModule({
      load: [appConfig, databaseConfig, kafkaConfig],
      envFilePath: ['apps/user-service/.env', '.env.shared'],
    }),
    LoggerModule.forRoot(),
  ],
  controllers: [UserServiceController],
  providers: [UserServiceService],
})
export class UserServiceModule {}
