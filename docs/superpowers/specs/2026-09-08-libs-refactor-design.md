# Refactor `libs/` — core / common / contracts

**Ngày:** 2026-09-08
**Trạng thái:** Đã thống nhất, chờ review trước khi lập plan.

## Bối cảnh & động cơ

`libs/` hiện có 7 lib (`cache`, `common`, `config`, `database`, `logger`,
`queue`, `shared`). Cấu trúc đã tiến hóa khỏi mô tả trong `CLAUDE.md` (vốn
mô tả `dto`). Pain point được xác nhận:

1. **`common` quá tạp** — trộn HTTP concern (jwt guard, http filter, swagger,
   validation pipe), RPC concern (rpc filter, rpc-error) và code thuần.
2. **Ranh giới không rõ** — khó biết mỗi lib chịu trách nhiệm gì.
3. **Rác cấu hình** — alias/project `dto` đã chết vẫn còn; `cache` rỗng/hỏng
   (index trỏ tới file không tồn tại); tên package `@base/*` lệch alias `@app/*`.
4. **Chuẩn bị scale** — cần convention nhất quán khi thêm service/lib.

## Cấu trúc đích

```
libs/
  config/      (@app/config)          # giữ top-level — bị import nhiều nhất, không phụ thuộc ai
  core/                                # infra module ngoại vi có state/DI
    database/  (@app/core/database)
    logger/    (@app/core/logger)
    queue/     (@app/core/queue)
  common/      (@app/common)          # code thuần, không state
    exception/  decorators/  guards/  interceptors/  pipes/  docs/  utils/  constants/
  contracts/   (@app/contracts)       # đổi từ shared — hợp đồng cross-service
    dto/  patterns/  (+ enum dùng chung sau này)
  # cache: XÓA
```

3 vai trò rõ ràng: **boot** (config + core) / **dùng lại** (common) /
**hợp đồng** (contracts).

## Quy tắc phụ thuộc (một chiều, không vòng lặp)

```
contracts  → không phụ thuộc lib nào
config     → không phụ thuộc lib nào
common     → chỉ phụ thuộc config
core/*     → phụ thuộc config; core/queue thêm phụ thuộc common (isRpcErrorPayload)
apps       → phụ thuộc tất cả
```

Đáy: `contracts`, `config`. Giữa: `common`. Trên libs: `core`. Trên hết: `apps`.

## Quy tắc đặt constant / enum

Constant/enum đi theo **chủ sở hữu hành vi**, KHÔNG gom thành 1 lib constants riêng:

- **Truyền qua Kafka giữa các service** (patterns; sau này enum trong DTO như
  `UserRole`, `OrderStatus`) → nằm cùng DTO trong `contracts`. Enum là một phần
  hình dạng payload → đổi = breaking contract.
- **Hằng nội bộ của một lib** (timeout, error map, DI token kafka) → nằm ngay
  trong lib đó, cạnh code dùng nó.
- **Chỉ 1 service dùng** (vd `AUTH_COMMANDS`) → giữ trong app, không đẩy lên libs.

## Grouped library `core`

`database/logger/queue` share 1 `package.json` + 1 `tsconfig.lib.json`, phân tách
bằng barrel con (`@app/core/logger`...). Kiểu grouped library của Nest — gọn hơn,
đánh đổi: không versioning riêng từng module (chấp nhận được trong monorepo nội bộ).

## Quyết định đã chốt

- `config` giữ top-level, KHÔNG vào core.
- `cache` XÓA (rỗng, hỏng, chưa ai dùng).
- Lib chung tên **`contracts`** (không dùng `shared`/`protocol`).
- Tên package giữ **`@base/*`** — chỉ đồng bộ alias import `@app/*`, không đổi field `name`.

## Kế hoạch dọn rác cấu hình (4 nơi)

- `tsconfig.json` paths — xóa `@app/dto`, `@app/cache`; đổi `@app/shared`→`@app/contracts`;
  đổi `@app/database|logger|queue`→`@app/core/*`.
- `package.json` jest `moduleNameMapper` — đồng bộ y hệt.
- `nest-cli.json` projects — xóa `dto`, `cache`; đổi `shared`→`contracts`; gom core.
- Barrel + `package.json` + `tsconfig.lib.json` của từng lib mới.

## Blast radius import (đếm từ code thật)

| Alias cũ        | → mới                | apps |   libs    |
| --------------- | -------------------- | :--: | :-------: |
| `@app/shared`   | `@app/contracts`     |  8   |     0     |
| `@app/logger`   | `@app/core/logger`   |  9   | 1 (queue) |
| `@app/database` | `@app/core/database` |  2   |     0     |
| `@app/queue`    | `@app/core/queue`    |  2   |     0     |
| `@app/common`   | _không đổi_          |  3   |     1     |
| `@app/config`   | _không đổi_          |  8   |     5     |

~24 dòng import đổi chuỗi, không đổi logic.

## Trình tự thực hiện (mỗi bước build được)

1. Tạo thư mục mới, `git mv` files (giữ history).
2. Sửa barrel + `package.json` + `tsconfig.lib.json` từng lib mới.
3. Cập nhật 4 file cấu hình root.
4. Đổi import trong apps + libs.
5. Xóa `cache`, xóa alias/project chết (`dto`, `cache`).
6. `pnpm build` + `pnpm lint` verify.

## Ngoài phạm vi

- Không refactor logic bên trong các module (chỉ di chuyển + đổi alias).
- Không đổi tên package `@base/*`.
- Không thêm lib mới (cache thêm lại sau khi cần).
