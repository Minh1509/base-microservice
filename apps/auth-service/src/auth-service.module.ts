import {
  appConfig,
  buildConfigModule,
  databaseConfig,
  jwtConfig,
  kafkaConfig,
} from '@app/config';
import { DatabaseModule } from '@app/database';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';
import { CreateAdminCommand } from '../commands/create-admin.command';
import { UserEntity } from '../entities/user.entity';

@Module({
  imports: [
    buildConfigModule({
      load: [appConfig, databaseConfig, kafkaConfig, jwtConfig],
      envFilePath: ['apps/auth-service/.env', '.env.shared'],
    }),
    DatabaseModule,
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService, CreateAdminCommand],
})
export class AuthServiceModule {}
