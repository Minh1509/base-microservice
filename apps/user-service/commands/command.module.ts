import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { CreateUserCommand } from './create-user.command';
import { UserEntity } from '../entities/user.entity';

@Module({
  imports: [MikroOrmModule.forFeature([UserEntity])],
  providers: [CreateUserCommand],
  exports: [CreateUserCommand],
})
export class CommandModule {}
