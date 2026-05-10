# Plan — Phase 3: Restructure, DX, RPC wiring, response shape

## Context

Sau khi đã hardened Kafka boundary + DTO + logger + dockerize (plan trước), dự án vẫn vướng nhiều khó khăn vận hành:

- **Folder layout chưa chuẩn**: `entities/`, `commands/`, `migrations/`, `seeders/` rải rác, `cli.module.ts` duplicate phần lớn `auth-service.module.ts`.
- **Pattern registry ở sai chỗ** (`libs/common/src/rpc/patterns.ts`) — user muốn chuyển sang `libs/common/src/constants/`.
- **Docker/compose** gom hết infra + apps vào 1 file, khó phân biệt dev mode. Dockerfile cho auth/user vẫn copy package.json của các service khác (vô hại nhưng rác).
- **Config env** giữa `.env.shared` / `apps/*/.env` / compose `environment:` chưa nhất quán — host mode đọc `localhost`, container mode phải override nhưng logic ưu tiên không rõ.
- **Migration workflow** hiện phải gõ đầy đủ: `pnpm mikro:auth migration:create --name=...`. User muốn shortcut.
- **Thiếu DX tooling**: Husky + Prettier pre-commit, PM2 config để chạy 3 app từ 1 lệnh lúc dev, Makefile cho phổ biến lệnh, script bootstrap DB mới cho service mới.
- **Global error handling**: chỉ có `RpcExceptionFilter` phía microservice, gateway chưa có `HttpExceptionFilter` global trả envelope `{ code, message, timestamp, path }`. `ValidationPipe` hiện trả 400, user muốn 422.
- **Response DTO**: raw response (không wrap) nhưng có interface/class cho từng endpoint để type-safe.

Quyết định đã chốt với user:

- **Layout**: per-service top-level — `apps/<service>/{src, entities, commands, database/{migrations,seeders}}`.
- **Response**: raw payload + `GlobalHttpExceptionFilter` envelope `{ code, message, timestamp, path }`; `ValidationPipe` throw `UnprocessableEntityException` (422); `ResponseDto` class cho type.
- **RPC**: không thêm feature mới; di dời patterns sang `libs/common/src/constants/`, thêm global interceptor + filter chuẩn hoá, giữ sendRpc helper.
- **Patterns**: `libs/common/src/constants/patterns.ts` thay cho `libs/common/src/rpc/patterns.ts`.

Outcome:

- `pnpm dev` chạy 1 phát (PM2) 3 app + infra sẵn sàng.
- `pnpm mg:auth:create <name>` tạo migration `database/migrations/<timestamp>_<name>.ts`.
- `git commit` tự chạy Prettier; `git commit --no-verify` bỏ qua.
- `docker compose -f docker-compose-dev.yml up -d` chỉ dựng infra; `docker compose up -d` dựng full stack.
- Một lệnh `make fresh` wipe DB + recreate + migrate + seed sạch.

---

## Scope & approach

### A. Restructure folder per-service

**Mục tiêu**: mỗi service tự chứa — bootstrap, domain code, migrations, seeders, commands, entities. Xóa `cli.module.ts` duplicate.

**Trước → Sau** (ví dụ auth-service):

```
apps/auth-service/
├── src/
│   ├── entities/user.entity.ts          → chuyển ra apps/auth-service/entities/
│   ├── commands/create-admin.command.ts → chuyển ra apps/auth-service/commands/
│   ├── cli.ts
│   ├── cli.module.ts                    → XÓA (gộp vào auth-service.module)
│   ├── auth-service.module.ts
│   ├── auth-service.controller.ts
│   ├── auth-service.service.ts
│   └── main.ts
├── migrations/                          → chuyển ra apps/auth-service/database/migrations/
├── seeders/                             → chuyển ra apps/auth-service/database/seeders/
├── mikro-orm.config.ts
├── Dockerfile
├── ecosystem.config.cjs                 → MỚI: PM2 per-service (hoặc root ecosystem.config.cjs)
├── package.json
└── tsconfig.app.json
```

Sau restructure:

```
apps/auth-service/
├── src/
│   ├── auth-service.module.ts           # gộp luôn CreateAdminCommand provider
│   ├── auth-service.controller.ts
│   ├── auth-service.service.ts
│   ├── cli.ts
│   └── main.ts
├── entities/user.entity.ts
├── commands/create-admin.command.ts
├── database/
│   ├── migrations/Migration20260510054114.ts
│   └── seeders/DatabaseSeeder.ts
├── mikro-orm.config.ts
├── Dockerfile
├── package.json
└── tsconfig.app.json
```

**Path updates**:

- `apps/auth-service/mikro-orm.config.ts`:
  - `entitiesTs: ['apps/auth-service/entities/**/*.entity.ts']`
  - `entities: ['dist/apps/auth-service/entities/**/*.entity.js']` (không dùng ở runtime bundle nhưng cần cho CLI)
  - `migrations.path/pathTs: 'apps/auth-service/database/migrations'`
  - `seeder.path/pathTs: 'apps/auth-service/database/seeders'`
- `apps/auth-service/tsconfig.app.json` include thêm `"../entities/**/*"`, `"../commands/**/*"`. Thực tế tôi sẽ đổi `include` thành `["src/**/*", "entities/**/*", "commands/**/*"]` (relative từ apps/auth-service) để webpack bundle thấy 3 folder.
- Import trong code: `src/commands/...` → `../commands/...` (từ src/), hoặc tốt hơn thiết lập TS path alias `@auth/*` → `apps/auth-service/*` để cross-folder import gọn gàng. Nhưng làm thế phá pattern repo, nên chỉ dùng relative `../entities/user.entity`.
- **Xoá `cli.module.ts`**: `CreateAdminCommand` đăng ký thẳng trong `AuthServiceModule.providers` (module đầy đủ `DatabaseModule + MikroOrmModule.forFeature([UserEntity])`). `cli.ts` dùng chính `AuthServiceModule` thay cho `AuthCliModule`.

user-service tương tự nhưng chưa có entities/commands → chỉ tạo folder rỗng và di chuyển migrations/seeders.

### B. Di dời pattern registry sang `libs/common/src/constants/`

**File mới**: `libs/common/src/constants/`

- `patterns.ts` — move nguyên văn từ `libs/common/src/rpc/patterns.ts`.
- `index.ts` — `export * from './patterns'`.

**File sửa**:

- `libs/common/src/index.ts` — thêm `export * from './constants';` (xóa dòng cũ ở `rpc` nếu có).
- `libs/common/src/rpc/index.ts` — bỏ dòng `export * from './patterns';`.
- **Xóa** `libs/common/src/rpc/patterns.ts`.

Import ở consumer chỉ cần `from '@app/common'` — không đổi chữ. Patterns là "hợp đồng cross-service", thuộc về contracts/constants, không phải cơ chế vận chuyển RPC → hợp lý.

### C. Global HTTP exception filter + response shape

**File mới** `libs/common/src/http/`:

- `http-error.ts`:

  ```ts
  export interface HttpErrorResponse {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    path: string;
  }
  ```

- `global-exception.filter.ts` — `@Catch()` trên HTTP context. Nhận mọi `HttpException` + `Error`, build `HttpErrorResponse`, trả về đúng status code. Đồng thời nhận dạng:
  - `UnprocessableEntityException` từ ValidationPipe → `code: 'VALIDATION_FAILED'`, `details: string[]`.
  - `HttpException` có body `{ code, message, details? }` (đã từ `sendRpc` map) → giữ code, không override.
  - `Error` khác → 500, `code: 'INTERNAL_ERROR'`, log stack.

- `response.dto.ts`:

  ```ts
  export abstract class BaseResponseDto {}
  // Endpoints sẽ extends/compose: class PingAuthResponseDto extends BaseResponseDto { service: string; env: string; echo: unknown; ts: string; }
  ```

- `index.ts` re-export.

**File sửa**:

- `apps/api-gateway/src/main.ts`:
  - `ValidationPipe({ whitelist, transform, forbidNonWhitelisted, errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })` → chuyển 400 → 422.
  - `app.useGlobalFilters(new GlobalHttpExceptionFilter())`.

- `libs/dto/src/{auth,user}/ping.response.dto.ts` — thêm `PingAuthResponseDto`, `PingUserResponseDto`. Controller `@ApiResponse` hoặc return type rõ.
- `apps/api-gateway/src/api-gateway.controller.ts`: return type annotate `Promise<PingAuthResponseDto>`.

### D. Docker: tách compose, fix Dockerfile

**File mới**: `docker-compose-dev.yml` — copy tất cả infra services từ `docker-compose.yml` hiện tại (postgres, kafka, kafka-ui, kong, redis). Mục đích: dev mode chạy `docker compose -f docker-compose-dev.yml up -d`. Kong trong file này mount `kong.yml` (host mode).

**File sửa**: `docker-compose.yml` — còn lại giữ cả infra + 3 apps (full-container mode). Kong mount `kong.apps.yml`. Bỏ profile hack `KONG_DECLARATIVE_CONFIG` env — giờ hai file compose tách hẳn.

**Dockerfile cleanup**: hiện 3 Dockerfile đều copy package.json của 3 service → rác nhưng vô hại. Giữ nguyên vì tách ra cần nhiều Dockerfile workflow phức tạp hơn (`pnpm install --filter` đòi biết workspace layout). Thay vào đó thêm comment trong Dockerfile giải thích: **bắt buộc copy cả 3 package.json vì `pnpm install --frozen-lockfile` verify lockfile toàn workspace**, bỏ bớt sẽ fail.

Bonus nhỏ: 2 Dockerfile auth + user copy thêm migrations để CI có thể run migration sau khi build image (optional):

```
COPY --from=build /app/apps/auth-service/database ./apps/auth-service/database
COPY --from=build /app/apps/auth-service/mikro-orm.config.ts ./apps/auth-service/
```

Cần copy `ts-node` + `tsconfig-paths` + `@mikro-orm/cli` as prod deps → size tăng. **User đã nói migration chạy thủ công ngoài container** → **KHÔNG** làm phần này. Giữ runtime image gọn.

### E. `.env` & config ưu tiên

Quy ước cuối (thống nhất mọi nơi):

**3 nguồn env, thứ tự ưu tiên (cao nhất ghi đè):**

1. `process.env` set từ shell / compose `environment:` → **cao nhất**.
2. `apps/<service>/.env` (per-service, untracked).
3. `.env.shared` (root, tracked, defaults dev-safe) → **thấp nhất**.

**Nest ConfigModule**: `envFilePath: ['apps/<service>/.env', '.env.shared']` — Nest load thứ tự trái → phải, nhưng **không override** biến đã set. Để per-service thắng shared, phải đặt per-service **trước**. Hiện đã đúng.

**Compose `environment:`**: đã set `POSTGRES_HOST=postgres`, `KAFKA_BROKERS=kafka:9092` → override `.env.shared` (localhost). Đúng hướng.

**`.env.shared` đề xuất** (tracked, trong repo):

```
NODE_ENV=development
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
KAFKA_BROKERS=localhost:9094
REDIS_PASSWORD=redis-dev-pass
LOG_LEVEL=debug
```

**`apps/api-gateway/.env`** (untracked, dev copy từ `.env.example`):

```
PORT=3000
KAFKA_CLIENT_ID=gateway-service
KAFKA_GROUP_ID=gateway-consumer
```

**`apps/auth-service/.env`**:

```
POSTGRES_DB=auth_db
KAFKA_CLIENT_ID=auth-service
KAFKA_GROUP_ID=auth-consumer
JWT_SECRET=dev-only-secret
JWT_EXPIRES_IN=1h
```

**`apps/user-service/.env`**:

```
POSTGRES_DB=user_db
KAFKA_CLIENT_ID=user-service
KAFKA_GROUP_ID=user-consumer
```

**`.env.example`** (root) — chứa đầy đủ các biến của tất cả app + compose, comment giải thích. Giữ như template onboarding.

**Fix compose**: một số container cần `REDIS_PASSWORD` dù app chưa dùng (Redis service `command` yêu cầu). Compose đã đọc qua `${REDIS_PASSWORD:?...}` → bắt buộc có `.env` ở root. Để 1 phát `docker compose up` chạy được, cần thêm **root `.env`** (untracked) tối thiểu chứa `POSTGRES_USER`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`. Bootstrap script tạo file này nếu chưa có.

### F. Migration/seeder DX

Mikro-orm CLI hỗ trợ `--name` trực tiếp. Thêm script shortcut:

```json
"mg:auth:create":  "pnpm mikro:auth migration:create --name",
"mg:auth:up":      "pnpm mikro:auth migration:up",
"mg:auth:down":    "pnpm mikro:auth migration:down",
"mg:auth:fresh":   "pnpm mikro:auth migration:fresh",
"mg:user:create":  "pnpm mikro:user migration:create --name",
"mg:user:up":      "pnpm mikro:user migration:up",
"mg:user:down":    "pnpm mikro:user migration:down",
"mg:user:fresh":   "pnpm mikro:user migration:fresh",

"seed:auth":       "pnpm mikro:auth seeder:run",
"seed:user":       "pnpm mikro:user seeder:run",
```

Dùng: `pnpm mg:auth:create add_user_phone` → file `apps/auth-service/database/migrations/Migration2026XXXX_add_user_phone.ts`.

### G. Script bootstrap DB mới cho service mới

**File mới**: `scripts/new-service-db.sh` — nhận arg `<service-name>` `<db-name>`:

1. Tạo file `apps/<service-name>/mikro-orm.config.ts` từ template.
2. Tạo `apps/<service-name>/database/{migrations,seeders}/`.
3. Append `CREATE DATABASE <db_name>;` vào `docker/postgres/init.sql` (không chạy lại được; cảnh báo user phải rebuild postgres hoặc manual `createdb`).
4. Thêm 4 scripts `mg:<service>:*` và `seed:<service>` vào `package.json` (sed-based append).

**Hạn chế**: Postgres `init.sql` chỉ chạy khi pgdata volume empty — nên script warn và gợi ý manual:

```bash
docker compose exec postgres psql -U postgres -c 'CREATE DATABASE <db>;'
```

### H. Husky + Prettier pre-commit, skip bằng `--no-verify`

**Cài**: `husky`, `lint-staged` (devDeps).

**Cấu hình**:

- `package.json` thêm:
  ```json
  "scripts": { "prepare": "husky" },
  "lint-staged": {
    "*.{ts,js,json,md,yml}": "prettier --write"
  }
  ```
- `.husky/pre-commit` chạy `pnpm exec lint-staged`.

Git native hỗ trợ `git commit --no-verify` (shortcut `-n`) → skip toàn bộ hook. Không cần custom flag.

### I. PM2 cho dev mode

**File mới**: `ecosystem.config.cjs` (root):

```js
module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: 'pnpm',
      args: 'dev:gateway',
      autorestart: false,
      watch: false,
    },
    {
      name: 'auth-service',
      script: 'pnpm',
      args: 'dev:auth',
      autorestart: false,
      watch: false,
    },
    {
      name: 'user-service',
      script: 'pnpm',
      args: 'dev:user',
      autorestart: false,
      watch: false,
    },
  ],
};
```

`pm2 start ecosystem.config.cjs` → 1 lệnh 3 process, `pm2 logs`, `pm2 stop all`. `watch` tắt vì Nest CLI đã có `--watch`.

**Scripts**:

```json
"pm2:dev":  "pm2 start ecosystem.config.cjs",
"pm2:stop": "pm2 delete ecosystem.config.cjs",
"pm2:logs": "pm2 logs"
```

Kết hợp: `docker compose -f docker-compose-dev.yml up -d && pnpm pm2:dev`. Có Makefile wrap sau.

### J. Makefile

**File mới**: `Makefile` (root) — shortcuts phổ biến:

```makefile
.PHONY: install dev stop logs build lint format down fresh mg-auth mg-user seed test

install:       ; pnpm install
dev:           ; docker compose -f docker-compose-dev.yml up -d && pnpm pm2:dev
stop:          ; pnpm pm2:stop
logs:          ; pnpm pm2:logs
build:         ; pnpm build
lint:          ; pnpm lint
format:        ; pnpm format
up:            ; docker compose up -d --build
down:          ; docker compose down
down-dev:      ; docker compose -f docker-compose-dev.yml down
fresh:         ; docker compose -f docker-compose-dev.yml down -v && make dev && sleep 5 && pnpm mg:auth:up && pnpm mg:user:up && pnpm seed:auth && pnpm seed:user
mg-auth:       ; pnpm mg:auth:create $(name)
mg-user:       ; pnpm mg:user:create $(name)
seed:          ; pnpm seed:auth && pnpm seed:user
test:          ; pnpm test
```

Usage: `make dev`, `make mg-auth name=add_phone`, `make fresh`.

### K. Format Prettier toàn dự án

Sau khi xong tất cả code change, chạy `pnpm format` — prettier tự fix file đã move.

---

## Critical files

**Tạo**:

- `libs/common/src/constants/{patterns.ts, index.ts}`
- `libs/common/src/http/{http-error.ts, global-exception.filter.ts, response.dto.ts, index.ts}`
- `libs/dto/src/auth/ping.response.dto.ts`
- `libs/dto/src/user/ping.response.dto.ts`
- `docker-compose-dev.yml`
- `ecosystem.config.cjs`
- `Makefile`
- `.husky/pre-commit`
- `scripts/new-service-db.sh`
- `apps/auth-service/database/migrations/Migration20260510054114.ts` (moved từ apps/auth-service/migrations)
- `apps/auth-service/database/seeders/DatabaseSeeder.ts` (moved)
- `apps/auth-service/entities/user.entity.ts` (moved)
- `apps/auth-service/commands/create-admin.command.ts` (moved)
- `apps/user-service/database/{migrations,seeders}/` (tạo rỗng + move seeder)

**Sửa**:

- `libs/common/src/index.ts` → re-export `./constants`, `./http`.
- `libs/common/src/rpc/index.ts` → bỏ export patterns.
- `libs/common/src/rpc/rpc-exception.filter.ts` — đổi status 400 → 422 trong branch `BadRequestException` để nhất quán với gateway `ValidationPipe`.
- `libs/dto/src/{auth,user}/index.ts` → export thêm `ping.response.dto`.
- `apps/auth-service/src/auth-service.module.ts` — import entity từ `../entities`, thêm `CreateAdminCommand` vào `providers`, chung module cho cả runtime và CLI.
- `apps/auth-service/src/cli.ts` — dùng `AuthServiceModule` thay `AuthCliModule`.
- **Xóa** `apps/auth-service/src/cli.module.ts`, `apps/user-service/src/cli.module.ts` (user không có command nhưng cli.ts hiện tại gọi nó — sửa cli.ts gọi `UserServiceModule`).
- `apps/auth-service/mikro-orm.config.ts` + user-service — update paths (entities/migrations/seeders mới).
- `apps/auth-service/tsconfig.app.json` + user-service + api-gateway — `include: ["src/**/*", "entities/**/*", "commands/**/*"]`.
- `apps/api-gateway/src/main.ts` — ValidationPipe `errorHttpStatusCode: 422`, useGlobalFilters `GlobalHttpExceptionFilter`.
- `apps/api-gateway/src/api-gateway.controller.ts` — annotate return type response DTO.
- `docker-compose.yml` — bỏ `profiles: ["apps"]`, bỏ biến `KONG_DECLARATIVE_CONFIG` override, Kong mount thẳng `kong.apps.yml`. Xoá 3 app service nếu phải viết lại cấu trúc → **sửa tại chỗ**, không xoá.
- `package.json` — scripts: `mg:*`, `seed:*`, `pm2:*`, `prepare`; deps: `husky`, `lint-staged`, `pm2` (dev), bỏ `joi` (không dùng).
- `.env.example` — sync theo layout mới ở section E.
- `.gitignore` — thêm `.pm2/`, `logs/`.
- `CLAUDE.md` — mô tả layout mới, compose-dev, pm2, makefile, husky, migration naming.
- `README.md` — cập nhật `make dev` là lệnh chính.

---

## Reuse

- `sendRpc` helper (`libs/common/src/rpc/rpc-client.helper.ts`) — không đổi.
- `RpcExceptionFilter` — chỉ đổi status 400→422 ở branch validation để nhất quán với HTTP filter.
- `buildWinstonOptions` — dùng nguyên trong main.ts.
- `buildConfigModule` + `EnvSchema` — dùng nguyên.
- Turbo cache, Nest CLI `webpack: true` — không đổi.

---

## Verification

**1. Build + lint + format**

```bash
pnpm install
pnpm format
pnpm build           # turbo 3 apps pass
pnpm lint            # 0 warnings
```

**2. Host-dev mode qua PM2**

```bash
docker compose -f docker-compose-dev.yml up -d
pnpm mg:auth:up && pnpm mg:user:up
pnpm pm2:dev
pm2 logs --lines 20   # thấy 3 app bootstrap

curl -X POST localhost:3000/auth/ping -d '{"message":"hi"}' -H 'Content-Type: application/json'
# 200 { service: 'auth-service', ... }

curl -X POST localhost:3000/auth/ping -d '{"bad":"x"}' -H 'Content-Type: application/json'
# 422 { code: 'VALIDATION_FAILED', message, details, timestamp, path }

curl http://localhost:3000/bogus
# 404 { code: 'NOT_FOUND', message, timestamp, path }

pnpm pm2:stop
```

**3. Full-container mode**

```bash
docker compose up -d --build
curl localhost:8000/auth/ping -X POST -d '{}' -H 'Content-Type: application/json'
docker compose down
```

**4. Migration create with name**

```bash
pnpm mg:auth:create add_phone_column
ls apps/auth-service/database/migrations    # thấy file mới có suffix _add_phone_column.ts
```

**5. Husky pre-commit**

```bash
echo 'const   x=1' > /tmp/test.ts && git add /tmp/test.ts
git commit -m 'test'         # prettier chạy, file được fix
git commit --no-verify -m 'skip' # hook bỏ qua
```

**6. Makefile**

```bash
make dev            # docker infra + pm2 3 app
make fresh          # wipe + migrate + seed
make mg-auth name=add_phone
```

**7. CLI command vẫn chạy**

```bash
pnpm cli:auth create-admin -e admin@local.dev -p 'password123'
# Migration workflow đứng riêng, CLI dùng AuthServiceModule không gặp vấn đề circular.
```

Plan xong — khối lượng lớn nhưng mỗi phần độc lập, có thể rollback một phần nếu lỗi.
