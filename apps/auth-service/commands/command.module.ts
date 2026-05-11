import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { CreateAdminCommand } from './create-admin.command';
import { UserEntity } from '../entities/user.entity';

@Module({
  imports: [MikroOrmModule.forFeature([UserEntity])],
  providers: [CreateAdminCommand],
  exports: [CreateAdminCommand],
})
export class CommandModule {}
