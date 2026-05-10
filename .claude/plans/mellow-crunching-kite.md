# Đơn giản hoá Docker Compose — giữ 2 file, chuẩn production

## Context

Hai file `docker-compose.yml` (full) và `docker-compose-dev.yml` (dev) chứa nhiều service definition trùng lặp (kafka, kafka-ui, postgres gần giống hệt). Trong `docker-compose.yml`, 3 app services lặp lại environment, depends_on, env_file. Ngoài ra có 1 bug healthcheck redis ở dev file và redis image tag là RC (không stable).

Mục tiêu: giảm duplication, fix bugs, giữ production-ready, giữ 2 file tách biệt (không gộp, không dùng profiles, không dùng base+override).

## Thay đổi

### 1. `docker-compose.yml` (full mode)

- **Thêm `x-app-base` YAML extension** làm anchor cho 3 app services — gom chung `restart`, `environment` (POSTGRES_HOST, KAFKA_BROKERS), `depends_on` (postgres+kafka healthy).
- Mỗi app service dùng `<<: *app-base`, chỉ khai báo fields riêng: `build`, `image`, `container_name`, `env_file`.
- `api-gateway` override `depends_on` (chỉ cần kafka, không cần postgres), thêm `ports` + `healthcheck`.
- **Thêm `start_period`** cho healthcheck postgres (5s), kafka (10s).
- **Đổi redis image** từ `redis:8.0-rc1-alpine` → `redis:7-alpine` (stable).
- **Sắp xếp lại service** theo thứ tự dependency: postgres → redis → kafka → kafka-ui → api-gateway → auth-service → user-service → kong.

### 2. `docker-compose-dev.yml` (dev mode)

- **Fix bug redis healthcheck** dòng 90: `['CMD-SHELL', 'redis-cli', 'ping']` → `['CMD', 'redis-cli', 'ping']` (CMD-SHELL nhận 1 string, không phải mảng 3 phần tử).
- **Đổi redis image** → `redis:7-alpine`.
- **Thêm `start_period`** cho healthcheck postgres (5s), kafka (10s).
- **Sắp xếp lại service** theo thứ tự dependency: postgres → redis → kafka → kafka-ui → kong.

### 3. KHÔNG thay đổi

- `docker/kong/kong.yml`, `docker/kong/kong.apps.yml` — giữ nguyên.
- `docker/postgres/init.sql` — giữ nguyên.
- Root `.env`, `.env.shared`, per-app `.env` — giữ nguyên.
- CLAUDE.md — giữ nguyên (Docker section vẫn đúng).

## Files cần sửa

- `docker-compose.yml`
- `docker-compose-dev.yml`

## Verify

```bash
docker compose -f docker-compose-dev.yml config   # validate YAML + interpolation
docker compose config                              # validate full mode YAML
```
