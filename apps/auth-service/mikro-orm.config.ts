import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SeedManager } from '@mikro-orm/seeder';
import { config as loadEnv } from 'dotenv';
import { join } from 'path';

// Load envs in the same precedence as buildConfigModule at runtime:
// .env.shared first, then apps/auth-service/.env overrides.
loadEnv({ path: join(process.cwd(), '.env.shared') });
loadEnv({
  path: join(process.cwd(), 'apps/auth-service/.env'),
  override: true,
});

export default defineConfig({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  dbName: process.env.POSTGRES_DB, // auth_db
  entities: ['dist/apps/auth-service/entities/**/*.entity.js'],
  entitiesTs: ['apps/auth-service/entities/**/*.entity.ts'],
  metadataProvider: TsMorphMetadataProvider,
  extensions: [Migrator, SeedManager],
  migrations: {
    path: 'apps/auth-service/database/migrations',
    pathTs: 'apps/auth-service/database/migrations',
    transactional: true,
    snapshot: false,
  },
  seeder: {
    path: 'apps/auth-service/database/seeders',
    pathTs: 'apps/auth-service/database/seeders',
    emit: 'ts',
  },
});
