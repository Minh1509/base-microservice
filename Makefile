
dev: docker-dev pm2

docker-dev:
	docker compose -f docker-compose-dev.yml up -d

docker-dev-down:
	docker compose -f docker-compose-dev.yml down

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down

build:
	pnpm build

lint:
	pnpm lint

format:
	pnpm format

test:
	pnpm test

mg-auth:
	pnpm migration:auth:create $(name)

mg-user:
	pnpm migration:user:create $(name)

mg-up:
	pnpm migration:auth:up
	pnpm migration:user:up

seed:
	pnpm seed:auth
	pnpm seed:user

# Nuclear reset (dev only)
fresh: docker-dev-down
	docker volume rm -f base-microservice_default base-microservice_postgres base-microservice_kafka 2>/dev/null || true
	rm -rf ./data/postgres ./data/kafka
	$(MAKE) docker-dev
	@echo "Waiting for healthchecks..."
	@sleep 8
	$(MAKE) mg-up
	$(MAKE) seed
