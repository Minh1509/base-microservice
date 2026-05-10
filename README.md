# base-microservice

Monorepo NestJS microservices — `api-gateway` (HTTP edge) + `auth-service`/`user-service` (Kafka). **pnpm workspaces + Turborepo**. Postgres 16, Kafka 3.7 KRaft, Kong 3.7, Redis 7.

```
client → Kong :8000 → api-gateway :3000 → Kafka → auth-service | user-service → Postgres
```

## Quick start (dev)

```bash
pnpm install
cp .env.example .env            # nếu chưa có root .env

make dev                        # docker compose -f docker-compose-dev.yml up -d  +  pm2 start 3 app
make pm2-logs                   # xem log watch

# smoke
curl -X POST http://localhost:3000/auth/ping -H 'Content-Type: application/json' -d '{"message":"hi"}'
curl -X POST http://localhost:3000/user/ping -H 'Content-Type: application/json' -d '{"message":"hi"}'

make stop                       # dừng pm2
make dev-down                   # tắt infra
```

Windows không có make: chạy `pnpm docker:dev && pnpm pm2:dev`.

Per-service `apps/*/·env` đã được commit sample dev. `.env.shared` (root, tracked) chứa defaults chung. Root `.env` (untracked) cho compose interpolation.

## Full container mode

```bash
pnpm docker:up                  # build + up 3 image app + infra
curl -X POST http://localhost:8000/auth/ping -H 'Content-Type: application/json' -d '{}'
pnpm docker:down
```

## Migrations & seeders

Chạy thủ công từ host (không auto-migrate trong container):

```bash
pnpm mg:auth:create add_user_phone   # sinh apps/auth-service/database/migrations/Migration<ts>_add_user_phone.ts
pnpm mg:auth:up                      # apply pending
pnpm mg:auth:down                    # rollback 1 step
pnpm mg:auth:fresh                   # drop + re-apply all
pnpm seed:auth                       # chạy DatabaseSeeder

pnpm mg:user:create init_profile     # user-service tương tự
pnpm seed:user
```

Wipe sạch + init lại:

```bash
make fresh
```

Thêm DB mới vào Postgres đang chạy (init.sql chỉ chạy lần đầu khi pgdata trống):

```bash
./scripts/new-service-db.sh billing_db
# exec CREATE DATABASE qua psql trong container bm-postgres, idempotent.
# Đồng thời append vào init.sql để khi wipe volume tự tái tạo.
```

## Commands (nest-commander)

```bash
pnpm cli:auth create-admin -e admin@local.dev -p 'password123'
```

## Scripts hữu ích

| Lệnh                               | Tác dụng                          |
| ---------------------------------- | --------------------------------- |
| `pnpm build`                       | Turbo build 3 app                 |
| `pnpm lint`                        | ESLint `--max-warnings=0`         |
| `pnpm format`                      | Prettier toàn bộ (ts/json/md/yml) |
| `pnpm docker:dev` / `:down`        | Infra only (dev mode)             |
| `pnpm docker:up` / `:down`         | Full container                    |
| `pnpm pm2:dev` / `:stop` / `:logs` | PM2 dev mode (3 app watch)        |
| `make dev`                         | Infra + pm2 1 lệnh                |
| `make fresh`                       | Wipe volume + migrate + seed      |

## Git hooks

Prettier chạy tự động khi commit (Husky + lint-staged). Skip:

```bash
git commit --no-verify
```

## Architecture & conventions

Đọc [`CLAUDE.md`](./CLAUDE.md) — config pattern (`@Inject(xxxConfig.KEY)`), env loading priority, RPC patterns registry, error boundary, HTTP response shape (422 validation + envelope filter), Winston logger.

## Layout

```
apps/
  api-gateway/    HTTP edge
  auth-service/   Kafka microservice — src/, entities/, commands/, database/{migrations,seeders}/
  user-service/   Kafka microservice — src/, database/{migrations,seeders}/
libs/
  common/         rpc (filter/helper), logger (winston), constants (patterns), http (global filter + response DTO)
  config/         config namespaces + EnvSchema (class-validator)
  database/       MikroOrmModule wrapper
  dto/            request + response DTOs
docker/
  kong/           kong.yml (dev) + kong.apps.yml (full)
  postgres/       init.sql (tạo DB)
scripts/
  new-service-db.sh
docker-compose-dev.yml     infra only
docker-compose.yml         infra + 3 app
ecosystem.config.cjs       PM2
Makefile
```
