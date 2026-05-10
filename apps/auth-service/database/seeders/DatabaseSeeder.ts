import * as bcrypt from 'bcrypt';
import { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { UserEntity } from '../src/entities/user.entity';

/**
 * Default seeder cho auth_db. Chạy bằng: `pnpm mikro:auth seeder:run`.
 * Idempotent: chỉ insert khi email chưa tồn tại.
 */
export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const email = 'admin@local.dev';
    const existing = await em.findOne(UserEntity, { email });
    if (existing) return;

    const admin = em.create(UserEntity, {
      email,
      passwordHash: await bcrypt.hash('admin12345', 10),
    });
    await em.persistAndFlush(admin);
  }
}
