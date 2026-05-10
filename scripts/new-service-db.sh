#!/usr/bin/env bash
# scripts/new-service-db.sh
# Usage: ./scripts/new-service-db.sh <db-name> [postgres-container]
# Example: ./scripts/new-service-db.sh billing_db
#
# Tạo thêm một database TRONG Postgres container đang chạy.
# docker/postgres/init.sql chỉ chạy khi pgdata volume lần đầu khởi tạo,
# nên thêm DB mới sau đó phải `createdb` thủ công — script này làm giúp.
#
# Idempotent: nếu DB đã tồn tại thì bỏ qua, không lỗi.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <db-name> [postgres-container]" >&2
  echo "       Default container: bm-postgres" >&2
  exit 1
fi

DB="$1"
CONTAINER="${2:-bm-postgres}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Đọc POSTGRES_USER từ root .env nếu có, mặc định 'postgres'.
ENV_FILE="$ROOT/.env"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
fi
PG_USER="${POSTGRES_USER:-postgres}"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}\$"; then
  echo "Error: container '$CONTAINER' không chạy." >&2
  echo "       Start nó bằng: pnpm docker:dev  (hoặc pnpm docker:up)" >&2
  exit 1
fi

EXISTS=$(docker exec -i "$CONTAINER" psql -U "$PG_USER" -tAc \
  "SELECT 1 FROM pg_database WHERE datname='$DB'" 2>/dev/null || true)

if [[ "$EXISTS" == "1" ]]; then
  echo "Database '$DB' đã tồn tại trong $CONTAINER — bỏ qua."
  exit 0
fi

docker exec -i "$CONTAINER" psql -U "$PG_USER" -c "CREATE DATABASE \"$DB\";"
echo "Created database '$DB' trong $CONTAINER."

# Append vào init.sql để lần wipe volume sau tự tái tạo.
INIT="$ROOT/docker/postgres/init.sql"
if [[ -f "$INIT" ]] && ! grep -qi "CREATE DATABASE $DB" "$INIT"; then
  echo "CREATE DATABASE $DB;" >> "$INIT"
  echo "Đã append vào $INIT để idempotent khi rebuild volume."
fi
