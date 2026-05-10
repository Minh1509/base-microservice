import { databaseConfig } from '@app/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      driver: PostgreSqlDriver,
      inject: [databaseConfig.KEY],
      useFactory: (cfg: ConfigType<typeof databaseConfig>) => ({
        host: cfg.host,
        port: cfg.port,
        user: cfg.username,
        password: cfg.password,
        dbName: cfg.database,
        autoLoadEntities: true,
      }),
    }),
  ],
  exports: [MikroOrmModule],
})
export class DatabaseModule {}
