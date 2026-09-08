# Refactor libs sang core/common/contracts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tái cấu trúc `libs/` từ 7 lib phẳng thành `config` + `core/*` + `common` + `contracts`, xóa `cache` chết, dọn rác cấu hình alias.

**Architecture:** Di chuyển file bằng `git mv` (giữ history), gom `database/logger/queue` thành grouped library `core` với barrel con, đổi `shared`→`contracts`, cập nhật 4 nơi khai báo alias (tsconfig root, jest mapper, nest-cli, lib configs), rồi đổi ~24 import. Không đổi logic bên trong module.

**Tech Stack:** NestJS monorepo, pnpm workspaces, Turborepo, TypeScript, Jest.

**Spec:** `docs/superpowers/specs/2026-09-08-libs-refactor-design.md`

## Global Constraints

- Tên package giữ nguyên `@base/*` (chỉ đổi alias import `@app/*`).
- Prettier: single quotes, trailing commas, 90 cols, sort imports.
- Mỗi task phải `pnpm build` xanh trước khi commit.
- Không đổi logic bên trong bất kỳ module nào — chỉ di chuyển + đổi alias.
- `config` và `common` giữ alias top-level `@app/config`, `@app/common` (không đổi).

---

### Task 1: Đổi `shared` → `contracts`

**Files:**

- Move: `libs/shared/` → `libs/contracts/` (git mv)
- Modify: `libs/contracts/package.json` (name)
- Modify: `libs/contracts/tsconfig.lib.json:5` (outDir)
- Modify: `tsconfig.json:35-36` (alias)
- Modify: `package.json` (jest moduleNameMapper dòng `@app/shared`)
- Modify: `nest-cli.json:94-101` (project `shared`)
- Modify (import): `apps/api-gateway/src/api-gateway.controller.ts:8`, `apps/api-gateway/src/api-gateway.service.ts:14`, `apps/api-gateway/src/dto/auth/index.ts:6`, `apps/api-gateway/src/dto/user/index.ts:1`, `apps/auth-service/src/auth-service.controller.ts:1`, `apps/auth-service/src/dto/index.ts:1`, `apps/user-service/src/dto/index.ts:1`, `apps/user-service/src/user-service.controller.ts:1`

**Interfaces:**

- Consumes: —
- Produces: alias `@app/contracts` → `libs/contracts/src`; package `@base/contracts`. Export không đổi: `AUTH_PATTERNS`, `USER_PATTERNS`, `LoginDto`, `PingAuthDto`, `PingUserDto`, `PingUserResponseDto`, v.v.

- [ ] **Step 1: Di chuyển thư mục giữ history**

```bash
git mv libs/shared libs/contracts
```

- [ ] **Step 2: Đổi name trong package.json**

Sửa `libs/contracts/package.json`:

```json
{
  "name": "@base/contracts",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "lint": "eslint src --max-warnings=0",
    "test": "pnpm -w exec jest libs/contracts --passWithNoTests"
  }
}
```

- [ ] **Step 3: Đổi outDir trong tsconfig.lib.json**

Sửa `libs/contracts/tsconfig.lib.json` dòng outDir:

```json
"outDir": "../../dist/libs/contracts"
```

- [ ] **Step 4: Đổi alias trong tsconfig.json root**

Thay 2 dòng `@app/shared` bằng:

```json
"@app/contracts": ["libs/contracts/src"],
"@app/contracts/*": ["libs/contracts/src/*"],
```

- [ ] **Step 5: Đổi jest moduleNameMapper trong package.json root**

Thay dòng `@app/shared` bằng:

```json
"^@app/contracts(|/.*)$": "<rootDir>/libs/contracts/src/$1",
```

- [ ] **Step 6: Đổi project trong nest-cli.json**

Đổi key `"shared"` thành `"contracts"` và mọi `libs/shared` → `libs/contracts` trong block đó.

- [ ] **Step 7: Đổi 8 import từ @app/shared sang @app/contracts**

Trong 8 file liệt kê ở trên, đổi chuỗi `'@app/shared'` → `'@app/contracts'` (giữ nguyên phần import).

- [ ] **Step 8: Build verify**

Run: `pnpm build`
Expected: 3 app build xanh, không lỗi module resolution.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(libs): doi shared thanh contracts"
```

---

### Task 2: Gom `database/logger/queue` thành grouped library `core`

**Files:**

- Move: `libs/database/src/*` → `libs/core/src/database/`, `libs/logger/src/*` → `libs/core/src/logger/`, `libs/queue/src/*` → `libs/core/src/queue/`
- Create: `libs/core/src/index.ts` (barrel gốc — để trống, dùng barrel con)
- Create: `libs/core/package.json`, `libs/core/tsconfig.lib.json`
- Delete: `libs/database/`, `libs/logger/`, `libs/queue/` (thư mục rỗng còn lại)
- Modify: `tsconfig.json` (alias), `package.json` (jest), `nest-cli.json` (projects)
- Modify (import): 9 dòng `@app/logger`, 2 dòng `@app/database`, 2 dòng `@app/queue` (danh sách bên dưới)

**Interfaces:**

- Consumes: `@app/config` (nội bộ logger/database/queue — không đổi), `@app/common` (nội bộ queue — không đổi).
- Produces: alias con `@app/core/database`, `@app/core/logger`, `@app/core/queue`. Export không đổi: `DatabaseModule`, `LoggerModule`, `AppLogger`, `buildWinstonOptions`, `KafkaModule`, `sendRpc`, `AUTH_SERVICE`, `USER_SERVICE`.

- [ ] **Step 1: Tạo cấu trúc core và di chuyển từng module giữ history**

```bash
mkdir -p libs/core/src/database libs/core/src/logger libs/core/src/queue
git mv libs/database/src/* libs/core/src/database/
git mv libs/logger/src/* libs/core/src/logger/
git mv libs/queue/src/* libs/core/src/queue/
```

- [ ] **Step 2: Tạo libs/core/package.json**

```json
{
  "name": "@base/core",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "lint": "eslint src --max-warnings=0",
    "test": "pnpm -w exec jest libs/core --passWithNoTests"
  }
}
```

- [ ] **Step 3: Tạo libs/core/tsconfig.lib.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "outDir": "../../dist/libs/core"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

- [ ] **Step 4: Tạo barrel gốc libs/core/src/index.ts**

```ts
export * from './database';
export * from './logger';
export * from './queue';
```

- [ ] **Step 5: Xóa thư mục lib cũ đã rỗng**

```bash
rm -rf libs/database libs/logger libs/queue
```

- [ ] **Step 6: Cập nhật alias trong tsconfig.json root**

Xóa 6 dòng alias cũ (`@app/database`, `@app/logger`, `@app/queue` và các `/*`), thêm:

```json
"@app/core": ["libs/core/src"],
"@app/core/*": ["libs/core/src/*"],
```

- [ ] **Step 7: Cập nhật jest moduleNameMapper trong package.json root**

Xóa 3 dòng cũ, thêm:

```json
"^@app/core(|/.*)$": "<rootDir>/libs/core/src/$1",
```

- [ ] **Step 8: Cập nhật nest-cli.json**

Xóa 3 project `database`, `logger`, `queue`. Thêm project `core`:

```json
"core": {
  "type": "library",
  "root": "libs/core",
  "entryFile": "index",
  "sourceRoot": "libs/core/src",
  "compilerOptions": {
    "tsConfigPath": "libs/core/tsconfig.lib.json"
  }
}
```

- [ ] **Step 9: Đổi 9 import @app/logger sang @app/core/logger**

Trong: `apps/api-gateway/src/api-gateway.module.ts:2`, `apps/api-gateway/src/api-gateway.service.ts:1`, `apps/api-gateway/src/main.ts:8`, `apps/auth-service/src/auth-service.module.ts:9`, `apps/auth-service/src/auth-service.service.ts:2`, `apps/auth-service/src/main.ts:7`, `apps/user-service/src/main.ts:7`, `apps/user-service/src/user-service.module.ts:3`, `apps/user-service/src/user-service.service.ts:2` — đổi `'@app/logger'` → `'@app/core/logger'`.

- [ ] **Step 10: Đổi 2 import @app/database sang @app/core/database**

Trong `apps/auth-service/src/auth-service.module.ts:8`, `apps/user-service/src/user-service.module.ts:2` — đổi `'@app/database'` → `'@app/core/database'`.

- [ ] **Step 11: Đổi 2 import @app/queue sang @app/core/queue**

Trong `apps/api-gateway/src/api-gateway.module.ts:3`, `apps/api-gateway/src/api-gateway.service.ts:2` — đổi `'@app/queue'` → `'@app/core/queue'`.

- [ ] **Step 12: Build verify**

Run: `pnpm build`
Expected: 3 app build xanh.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "refactor(libs): gom database/logger/queue thanh core"
```

---

### Task 3: Xóa lib `cache` chết và dọn alias thừa

**Files:**

- Delete: `libs/cache/`
- Modify: `tsconfig.json` (xóa alias `@app/cache`, và alias chết `@app/dto` nếu còn)
- Modify: `package.json` (xóa jest mapper `@app/cache`)
- Modify: `nest-cli.json` (xóa project `cache` và project chết `dto` nếu còn)

**Interfaces:**

- Consumes: —
- Produces: — (chỉ dọn, không có ai import `@app/cache`, đã xác nhận grep 0 kết quả).

- [ ] **Step 1: Xác nhận không ai dùng cache**

Run: `grep -rn "@app/cache" apps libs --include=*.ts`
Expected: không có kết quả.

- [ ] **Step 2: Xóa thư mục cache**

```bash
git rm -r libs/cache
```

- [ ] **Step 3: Xóa alias @app/cache và @app/dto trong tsconfig.json**

Xóa các dòng `@app/cache`, `@app/cache/*`, `@app/dto`, `@app/dto/*` trong `paths`.

- [ ] **Step 4: Xóa jest mapper trong package.json**

Xóa dòng `^@app/cache(|/.*)$` và `^@app/dto(|/.*)$` (nếu còn).

- [ ] **Step 5: Xóa project cache và dto trong nest-cli.json**

Xóa block project `"cache"` và `"dto"` (nếu còn).

- [ ] **Step 6: Build + lint verify**

Run: `pnpm build && pnpm lint`
Expected: xanh, không cảnh báo alias.

- [ ] **Step 7: Cập nhật CLAUDE.md phần mô tả layout libs**

Sửa block "Monorepo layout" trong `CLAUDE.md` phản ánh cấu trúc mới: `config`, `core/`, `common`, `contracts` (bỏ `dto`, `cache`, `database`, `logger`, `queue`, `shared`).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(libs): xoa cache chet va don alias thua"
```

---

## Self-Review

**Spec coverage:**

- Đổi `shared`→`contracts` → Task 1 ✓
- Gom `core` (database/logger/queue) → Task 2 ✓
- Xóa `cache` → Task 3 ✓
- Dọn alias `dto`/`cache` (4 nơi) → Task 1/2/3 ✓
- Giữ `config`, `common` top-level → không có task đụng vào ✓
- Giữ `@base/*` → package.json name giữ prefix `@base` ✓
- Quy tắc phụ thuộc: queue→common, các lib→config giữ nguyên (import nội bộ không đổi) ✓
- Blast radius 8+9+2+2 = 21 import trong apps → Task 1 (8) + Task 2 (13) ✓

**Placeholder scan:** Không có TBD/TODO. Mọi bước có lệnh hoặc nội dung cụ thể.

**Type consistency:** Export names (`DatabaseModule`, `AppLogger`, `buildWinstonOptions`, `KafkaModule`, `sendRpc`, `AUTH_SERVICE`, `USER_SERVICE`, `AUTH_PATTERNS`...) giữ nguyên qua các task — chỉ đổi đường dẫn alias.
