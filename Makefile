# Makefile — shortcut cho các lệnh hay dùng.
# Windows: cài GNU Make (choco install make) hoặc dùng `pnpm <script>` trực tiếp.

.PHONY: install dev stop logs build lint format up down dev-up dev-down fresh \
        mg-auth mg-user mg-up seed test pm2-dev pm2-stop pm2-logs

install:
	pnpm install

# Dev: infra (docker) + 3 Nest app (pm2 watch)
dev: dev-up pm2-dev

dev-up:
	pnpm docker:dev

dev-down:
	pnpm docker:dev:down

pm2-dev:
	pnpm pm2:dev

pm2-stop:
	pnpm pm2:stop

pm2-logs:
	pnpm pm2:logs

stop: pm2-stop

logs: pm2-logs

# Full container: 3 app + infra
up:
	pnpm docker:up

down:
	pnpm docker:down

build:
	pnpm build

lint:
	pnpm lint

format:
	pnpm format

# Migration shortcuts: `make mg-auth name=add_user_phone`
mg-auth:
	pnpm mg:auth:create $(name)

mg-user:
	pnpm mg:user:create $(name)

mg-up:
	pnpm mg:auth:up
	pnpm mg:user:up

seed:
	pnpm seed:auth
	pnpm seed:user

# Wipe volume, rebuild infra, migrate, seed — DANGEROUS ở prod.
fresh: dev-down
	docker volume rm -f base-microservice_default base-microservice_postgres base-microservice_kafka 2>/dev/null || true
	rm -rf ./data/postgres ./data/kafka
	pnpm docker:dev
	@echo "Sleeping 8s for Postgres + Kafka healthchecks..."
	@sleep 8
	pnpm mg:auth:up
	pnpm mg:user:up
	pnpm seed:auth
	pnpm seed:user

test:
	pnpm test
