import { Migration } from '@mikro-orm/migrations';

export class Migration20260513152839_init_db_auth extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table "users" (
        "id"            uuid          not null default gen_random_uuid(),
        "email"         varchar(255)  not null,
        "password_hash" varchar(255)  not null,
        "created_at"    timestamptz   not null default now(),
        constraint "users_pkey" primary key ("id")
      );
    `);
    this.addSql(`create unique index "users_email_unique" on "users" ("email");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "users";`);
  }
}
