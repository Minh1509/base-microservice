import { appConfig, buildConfigModule, databaseConfig, kafkaConfig } from '@app/config';
import { DatabaseModule } from '@app/database';
import { Module } from '@nestjs/common';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';

@Module({
  imports: [
    buildConfigModule({
      load: [appConfig, databaseConfig, kafkaConfig],
      envFilePath: ['apps/user-service/.env', '.env.shared'],
    }),
    DatabaseModule,
  ],
  controllers: [UserServiceController],
  providers: [UserServiceService],
})
export class UserServiceModule {}
