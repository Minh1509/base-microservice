import * as bcrypt from 'bcrypt';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Logger } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import { UserEntity } from '../entities/user.entity';

interface CreateUserOptions {
  email: string;
  password: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

@Command({
  name: 'create-user',
  description: 'Create a user in user_db',
})
export class CreateUserCommand extends CommandRunner {
  private readonly logger = new Logger(CreateUserCommand.name);

  constructor(private readonly orm: MikroORM) {
    super();
  }

  async run(_passedParams: string[], options: CreateUserOptions): Promise<void> {
    if (!EMAIL_REGEX.test(options.email)) {
      this.logger.error(`Invalid email format: ${options.email}`);
      process.exitCode = 1;
      return;
    }
    if (options.password.length < MIN_PASSWORD_LENGTH) {
      this.logger.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      process.exitCode = 1;
      return;
    }

    const em = this.orm.em.fork() as EntityManager;

    const existing = await em.findOne(UserEntity, { email: options.email });
    if (existing) {
      this.logger.warn(`User ${options.email} already exists — skipping.`);
      return;
    }

    const user = em.create(UserEntity, {
      email: options.email,
      passwordHash: await bcrypt.hash(options.password, 10),
    });
    await em.persistAndFlush(user);
    this.logger.log(`Created user: ${user.email} (id=${user.id})`);
  }

  @Option({ flags: '-e, --email <email>', description: 'User email', required: true })
  parseEmail(val: string): string {
    return val;
  }

  @Option({
    flags: '-p, --password <password>',
    description: `User password (plaintext, ≥ ${MIN_PASSWORD_LENGTH} chars, will be hashed)`,
    required: true,
  })
  parsePassword(val: string): string {
    return val;
  }
}
