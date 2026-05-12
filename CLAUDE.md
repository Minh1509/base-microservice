# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc trong repo này.

## Stack

- **Runtime**: Node.js, TypeScript (`strictNullChecks: true`, `noImplicitAny: false`)
- **Framework**: NestJS (microservice pattern)
- **Monorepo**: pnpm workspaces + Turborepo
- **DB**: PostgreSQL + MikroORM (PostgreSqlDriver), migrations thủ công
- **Messaging**: Kafka (KRaft, không Zookeeper)
- **Cache**: Redis
- **Logger**: nest-winston

## Architecture

```
client → api-gateway :3000 (HTTP) → Kafka → auth-service | user-service
```

- **api-gateway**: HTTP only. Dùng `sendRpc(client, pattern, payload)` từ `@app/common` — không `firstValueFrom` trần.
- **auth-service / user-service**: Kafka microservice thuần. Handler dùng `@MessagePattern(AUTH_PATTERNS.X)`.
- **main.ts**: Boot `ApplicationContext` transient để đọc `kafkaConfig.KEY`, close, rồi start microservice.

## Monorepo layout

```
apps/
  api-gateway/
  auth-service/
  user-service/
libs/
  common/        # sendRpc, RpcExceptionFilter, patterns, GlobalHttpExceptionFilter
  config/        # registerAs configs, buildConfigModule
  database/      # DatabaseModule (MikroORM)
  dto/           # cross-service DTOs và response DTOs
```

Khi thêm lib mới, sync alias ở **3 nơi**: `tsconfig.json`, root `package.json` (`jest.moduleNameMapper`), `nest-cli.json` (`projects`).

## Layout per-service

```
apps/<service>/
├── src/           # module, controller, service, main.ts, cli.ts
├── entities/      # @Entity() classes
├── commands/      # nest-commander @Command classes
├── database/
│   ├── migrations/
│   └── seeders/
└── mikro-orm.config.ts
```

`tsconfig.app.json` include `src/`, `entities/`, `commands/`. Exclude `database/` (CLI đọc trực tiếp, không bundle).

## Config pattern

Dùng `@Inject(xxxConfig.KEY)`, **không** dùng `ConfigService.get`:

```ts
@Injectable()
export class SomeService {
  constructor(
    @Inject(databaseConfig.KEY)
    private readonly db: ConfigType<typeof databaseConfig>,
  ) {}
}
```

Thêm namespace: tạo `libs/config/src/<x>.config.ts` với `registerAs`, add vào `buildConfigModule({ load: [...] })`.

## Environment — thứ tự ưu tiên

1. `process.env` / compose `environment:` block → cao nhất
2. `apps/<service>/.env` — per-app, untracked
3. `.env.shared` — root, tracked, dev-safe defaults

Root `.env` (untracked, copy từ `.env.example`) chỉ dùng cho compose YAML interpolation (`${POSTGRES_USER}`...), không phải per-app env.

## Kafka patterns

Pattern registry tại `libs/common/src/constants/patterns.ts`:

```ts
export const AUTH_PATTERNS = { PING: 'auth.ping' } as const;
export const ALL_AUTH_PATTERNS = Object.values(AUTH_PATTERNS);
```

Gateway `onModuleInit`: `ALL_AUTH_PATTERNS.forEach(subscribeToResponseOf)`.

**`KAFKA_CLIENT_ID`** của mỗi service phải khác nhau — cùng clientId → Kafka reject instance thứ hai.

## Error boundary

- Microservice throw `DomainRpcException({ status, code, message, details? })` hoặc `HttpException` / `Error` → `RpcExceptionFilter` chuẩn hoá.
- Gateway `sendRpc(...)`: TimeoutError → 504, RpcErrorPayload → HttpException đúng status, fallback → 500.

## HTTP response shape

- **Success**: raw payload theo `xxxResponseDto` (extends `BaseResponseDto`).
- **Error**: `GlobalHttpExceptionFilter` → `{ code, message, details?, timestamp, path }`.
- **Validation**: `ValidationPipe` với `errorHttpStatusCode: 422` → `{ code: 'VALIDATION_FAILED', details: string[] }`.

DTO sống trong `libs/dto/src/<domain>/` — không trong app.

## Database & migrations

```bash
pnpm mg:auth:create <name>   # tạo migration
pnpm mg:auth:up              # apply pending
pnpm mg:auth:down            # rollback 1 step
pnpm mg:auth:fresh           # drop all + re-apply
pnpm seed:auth               # chạy DatabaseSeeder
# user-service: mg:user:*, seed:user
```

Thêm DB mới: `./scripts/new-service-db.sh <db-name>` — idempotent, exec psql trong container `bm-postgres` và append `init.sql`.

## Dev commands

```bash
# Cài đặt
pnpm install

# Build / lint / format
pnpm build                   # turbo build 3 app
pnpm lint
pnpm format                  # prettier *.ts, *.json, *.md, *.yml

# Dev mode (Docker infra + host apps)
pnpm docker:dev              # postgres, kafka, kafka-ui, redis
pnpm pm2:dev                 # start 3 Nest apps qua PM2
pnpm pm2:logs
pnpm pm2:stop
# hoặc: make dev

# Full container
pnpm docker:up               # build image + start all
pnpm docker:down
```

| Service     | Port | Ghi chú                  |
| ----------- | ---- | ------------------------ |
| Postgres    | 5432 | `auth_db`, `user_db`     |
| Kafka       | 9094 | KRaft, external listener |
| Kafka UI    | 8080 | http://localhost:8080    |
| Redis       | 6379 |                          |
| api-gateway | 3000 | Full container mode      |

## Conventions

- **ESLint**: `no-floating-promises` + `no-unsafe-argument` là warning. `no-explicit-any` off. Unused vars: `argsIgnorePattern: '^_'`.
- **Prettier**: single quotes, trailing commas, 90 cols, sort imports.
- **ValidationPipe**: global ở cả 3 app — `whitelist`, `transform`, `forbidNonWhitelisted`, `errorHttpStatusCode: 422`.
- **DTO + pattern**: cross-service contract → sống trong `libs/`, không trong `apps/`.

## DX

- **PM2** (`ecosystem.config.cjs`): `autorestart: false` — Nest tự reload khi watch.
- **Husky + lint-staged**: pre-commit → Prettier auto-fix. Bỏ qua: `git commit --no-verify`.
- **Makefile**: `make dev`, `make fresh`, `make mg-auth name=<x>`, `make up/down`.
