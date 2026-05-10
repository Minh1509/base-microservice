import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SeedManager } from '@mikro-orm/seeder';
import { config as loadEnv } from 'dotenv';
import { join } from 'path';

loadEnv({ path: join(process.cwd(), '.env.shared') });
loadEnv({
  path: join(process.cwd(), 'apps/user-service/.env'),
  override: true,
});

export default defineConfig({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  dbName: process.env.POSTGRES_DB, // user_db
  entities: ['dist/apps/user-service/entities/**/*.entity.js'],
  entitiesTs: ['apps/user-service/entities/**/*.entity.ts'],
  metadataProvider: TsMorphMetadataProvider,
  extensions: [Migrator, SeedManager],
  migrations: {
    path: 'apps/user-service/database/migrations',
    pathTs: 'apps/user-service/database/migrations',
    transactional: true,
    snapshot: false,
  },
  seeder: {
    path: 'apps/user-service/database/seeders',
    pathTs: 'apps/user-service/database/seeders',
    emit: 'ts',
  },
});
