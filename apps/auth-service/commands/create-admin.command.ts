import * as bcrypt from 'bcrypt';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Logger } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import { UserEntity } from '../entities/user.entity';

interface CreateAdminOptions {
  email: string;
  password: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

@Command({
  name: 'create-admin',
  description: 'Create an admin user in auth_db',
})
export class CreateAdminCommand extends CommandRunner {
  private readonly logger = new Logger(CreateAdminCommand.name);

  constructor(
    private readonly em: EntityManager,
    @InjectRepository(UserEntity)
    private readonly users: EntityRepository<UserEntity>,
  ) {
    super();
  }

  async run(_passedParams: string[], options: CreateAdminOptions): Promise<void> {
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

    const existing = await this.users.findOne({ email: options.email });
    if (existing) {
      this.logger.warn(`User ${options.email} already exists — skipping.`);
      return;
    }

    const user = new UserEntity();
    user.email = options.email;
    user.passwordHash = await bcrypt.hash(options.password, 10);

    await this.em.persistAndFlush(user);
    this.logger.log(`Created admin user: ${user.email} (id=${user.id})`);
  }

  @Option({ flags: '-e, --email <email>', description: 'Admin email', required: true })
  parseEmail(val: string): string {
    return val;
  }

  @Option({
    flags: '-p, --password <password>',
    description: `Admin password (plaintext, ≥ ${MIN_PASSWORD_LENGTH} chars, will be hashed)`,
    required: true,
  })
  parsePassword(val: string): string {
    return val;
  }
}
