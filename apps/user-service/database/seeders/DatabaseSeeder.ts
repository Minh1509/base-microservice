import { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';

/**
 * Default seeder cho user_db. Chạy bằng: `pnpm mikro:user seeder:run`.
 * Hiện chưa có entity nào để seed — giữ skeleton cho feature sau.
 */
export class DatabaseSeeder extends Seeder {
  async run(_em: EntityManager): Promise<void> {
    // TODO: insert default rows khi user entity được định nghĩa.
  }
}
