# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package manager & task runner

**pnpm** workspaces + **Turborepo**. Root `package.json` scripts `dev`, `build`, `lint`, `test` delegate qua `turbo run ...`.

Kèm **Makefile** ở root cho shortcuts phổ biến (`make dev`, `make fresh`, `make mg-auth name=...`) — Windows cần `choco install make` hoặc dùng `pnpm <script>` trực tiếp.

```bash
pnpm install
pnpm build                     # turbo build cho 3 app
pnpm lint                      # turbo lint
pnpm format                    # prettier apps/**/*.ts, libs/**/*.ts, *.{json,md,yml}

pnpm dev:gateway               # watch mode single service
pnpm dev:auth
pnpm dev:user
```

## Hai chế độ docker

**Dev** (host-dev): Docker chỉ dựng infra, Nest apps chạy host qua PM2 (hoặc `pnpm dev:*` thủ công).

```bash
pnpm docker:dev                # docker compose -f docker-compose-dev.yml up -d
pnpm pm2:dev                   # pm2 start 3 app
# hoặc 1 phát: make dev
pnpm pm2:logs                  # pm2 logs
pnpm pm2:stop                  # pm2 delete
pnpm docker:dev:down
```

`docker-compose-dev.yml` chứa postgres, kafka, kafka-ui, redis.

**Full container**: build image 3 app + infra.

```bash
pnpm docker:up                 # docker compose up -d --build
pnpm docker:down
```

`docker-compose.yml` tách riêng cho mode này.

Services exposed on host:

| Service     | Port | Notes                                                        |
| ----------- | ---- | ------------------------------------------------------------ |
| Postgres    | 5432 | DB tạo qua `docker/postgres/init.sql` (`auth_db`, `user_db`) |
| Kafka       | 9094 | KRaft, external listener                                     |
| Kafka UI    | 8080 | <http://localhost:8080>                                      |
| Redis       | 6379 |                                                              |
| api-gateway | 3000 | Full mode thôi; dev mode chạy host                           |

## Environment files — 3 nguồn, thứ tự ưu tiên

1. `process.env` / compose `environment:` block → **cao nhất**.
2. `apps/<service>/.env` per-app (untracked).
3. `.env.shared` ở root (tracked, dev-safe defaults) → **thấp nhất**.

Nest `buildConfigModule({ envFilePath: ['apps/<name>/.env', '.env.shared'] })` — thứ tự trái→phải, per-app thắng shared vì load trước, `process.env` sẵn có luôn thắng tất cả.

Compose cũng dùng `env_file: [.env.shared, apps/<name>/.env]` cộng `environment: { POSTGRES_HOST: postgres, KAFKA_BROKERS: kafka:9092 }` để override khi chạy trong docker network.

Ngoài ra **root `.env`** (untracked, copy từ `.env.example`) phục vụ interpolation trong compose YAML (`${POSTGRES_USER}`, `${REDIS_PASSWORD}`...) — **không** phải per-app env.

## Config pattern — `@Inject(xxxConfig.KEY)`, never `ConfigService.get`

```ts
import { databaseConfig } from '@app/config';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class SomeService {
  constructor(
    @Inject(databaseConfig.KEY)
    private readonly db: ConfigType<typeof databaseConfig>,
  ) {}
}
```

Thêm namespace mới: tạo `libs/config/src/<x>.config.ts` với `registerAs`, add vào `buildConfigModule({ load: [...] })` của app cần.

## Layout per-service

```
apps/auth-service/
├── src/                        # bootstrap + controllers/services/cli
│   ├── auth-service.module.ts
│   ├── auth-service.controller.ts
│   ├── auth-service.service.ts
│   ├── main.ts
│   └── cli.ts
├── entities/                   # @Entity() classes
│   └── user.entity.ts
├── commands/                   # nest-commander @Command classes
│   └── create-admin.command.ts
├── database/
│   ├── migrations/             # mikro-orm migration:create output
│   └── seeders/                # DatabaseSeeder.ts
├── mikro-orm.config.ts
├── Dockerfile
├── package.json
└── tsconfig.app.json           # include: src/, entities/, commands/
```

`tsconfig.app.json` include cả 3 folder (`src`, `entities`, `commands`) để webpack bundle thấy hết. `database/` exclude (không bundle; CLI đọc trực tiếp qua `pnpm mg:*`).

## Architecture

```
client → api-gateway :3000 (HTTP) → Kafka → auth-service | user-service
```

- **api-gateway** — HTTP + `ClientsModule.registerAsync` (AUTH_SERVICE, USER_SERVICE). **Luôn** gọi `sendRpc(client, pattern, payload)` (từ `@app/common`) — không `firstValueFrom` trần.
- **auth-service, user-service** — Kafka microservice pure. Handler `@MessagePattern(AUTH_PATTERNS.X)`. ValidationPipe global (errorHttpStatusCode 422) + `RpcExceptionFilter` global.
- Main.ts boots `ApplicationContext` transient để đọc `kafkaConfig.KEY`, close, rồi start microservice với values.

Aliases phải sync 3 nơi khi thêm lib: `tsconfig.json`, root `package.json` (`jest.moduleNameMapper`), `nest-cli.json` (`projects`).

## Database & migrations

`@app/database.DatabaseModule` gọi `MikroOrmModule.forRootAsync` (PostgreSqlDriver), inject `databaseConfig.KEY`, `autoLoadEntities: true`. Mỗi service pick DB bằng `POSTGRES_DB` trong `.env`.

Migrations + seeders **chạy thủ công từ host** qua scripts shortcut:

```bash
pnpm mg:auth:create <name>     # sinh apps/auth-service/database/migrations/Migration<ts>_<name>.ts
pnpm mg:auth:up                # apply pending
pnpm mg:auth:down              # rollback 1 step
pnpm mg:auth:fresh             # drop all + re-apply all
pnpm seed:auth                 # chạy DatabaseSeeder

# user-service tương tự: mg:user:*, seed:user
```

Thêm DB cho service mới (Postgres đang chạy): `./scripts/new-service-db.sh <db-name>` — exec `psql CREATE DATABASE` trong container `bm-postgres` và append vào `init.sql` để lần wipe volume sau tự tái tạo. Idempotent. `docker/postgres/init.sql` chỉ chạy lần đầu khi pgdata volume trống, nên lần thêm DB sau phải dùng script này.

## Kafka patterns + error boundary — `@app/common`

Pattern registry: `libs/common/src/constants/patterns.ts`.

```ts
export const AUTH_PATTERNS = { PING: 'auth.ping' } as const;
export const ALL_AUTH_PATTERNS = Object.values(AUTH_PATTERNS);
```

Gateway service `onModuleInit` loop `ALL_AUTH_PATTERNS.forEach(subscribeToResponseOf)` → thêm pattern mới chỉ cần append vào const.

Handler microservice: `@MessagePattern(AUTH_PATTERNS.LOGIN)` thay string trần.

**Error envelope** (`RpcErrorPayload`):

- Microservice throw `DomainRpcException({ status, code, message, details? })` hoặc bất kỳ `HttpException` / `Error` — `RpcExceptionFilter` chuẩn hoá.
- Gateway dùng `sendRpc(client, pattern, payload, { timeoutMs })` — map TimeoutError → 504, RpcErrorPayload → HttpException đúng status, fallback → 500.

**`KAFKA_CLIENT_ID`** của auth-service và user-service phải khác nhau (đã set trong `.env` per-app). Cùng `clientId` → Kafka reject instance thứ hai.

## HTTP response shape — `@app/common/http`

- **Success**: raw payload theo `xxxResponseDto` (class extends `BaseResponseDto`). Controller annotate `Promise<PingAuthResponseDto>`.
- **Error**: `GlobalHttpExceptionFilter` bắt mọi `HttpException` + `Error`, trả envelope `{ code, message, details?, timestamp, path }`.
- **Validation**: `ValidationPipe` config `errorHttpStatusCode: UNPROCESSABLE_ENTITY` → lỗi validate body → **422** (không phải 400) với `code: 'VALIDATION_FAILED'`, `details: string[]`.

DTO cả request lẫn response ở `libs/dto/src/<domain>/{name}.dto.ts` + `{name}.response.dto.ts`.

## Logger — `nest-winston`

`WinstonModule.createLogger(buildWinstonOptions({ serviceName }))` ở mọi `main.ts`. Pass vào cả `createApplicationContext` + `createMicroservice/create`. Dev: `nestLike` pretty + color. Prod: JSON single-line (`service`, `level`, `timestamp`, `context`, `stack`).

## DX: PM2 + Husky + Makefile

**PM2** (`ecosystem.config.cjs`): `pnpm pm2:dev` chạy 3 Nest watch trong 1 session. `autorestart: false` vì Nest đã tự reload.

**Husky + lint-staged**: `.husky/pre-commit` → `pnpm exec lint-staged` → Prettier auto-fix `*.{ts,js,json,md,yml,yaml}`. Bỏ qua: `git commit --no-verify`.

**Makefile** — mapping:

- `make dev` = `docker:dev + pm2:dev`
- `make fresh` = wipe volume + migrate + seed
- `make mg-auth name=add_phone` = `pnpm mg:auth:create add_phone`
- `make up / down` = full container

## Conventions

- TS: `strictNullChecks: true`, `noImplicitAny: false`, `strictBindCallApply: false` — be deliberate về `any`.
- ESLint `recommendedTypeChecked`: `no-floating-promises` + `no-unsafe-argument` là warning. `no-explicit-any` off. `argsIgnorePattern: '^_'` cho unused vars.
- Prettier: single quotes, trailing commas, 90 cols, sort imports.
- ValidationPipe global ở api-gateway + 2 microservice (whitelist/transform/forbidNonWhitelisted, 422).
- DTO + pattern là cross-service contract → sống trong `libs/{dto,common/constants}`, không trong app.
