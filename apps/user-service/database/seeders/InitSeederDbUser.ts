import * as bcrypt from 'bcrypt';
import { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { UserEntity } from 'apps/auth-service/entities/user.entity';

export class InitSeederDbUser extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const email = 'admin@local.dev';
    const existing = await em.findOne(UserEntity, { email });
    if (existing) return;

    const user = em.create(UserEntity, {
      email,
      passwordHash: await bcrypt.hash('password123', 10),
    });
    await em.persistAndFlush(user);
  }
}
