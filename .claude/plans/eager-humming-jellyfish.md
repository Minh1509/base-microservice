# Plan: Simplify Exceptions, Restructure Kafka/RPC, Patterns, Gateway & DTO

## Context

Sau lần refactor trước, cần tiếp tục đơn giản hóa:

- Exception filters quá dài, nhiều private method lặp lại
- `sendRpc` nằm trong `rpc/` nhưng thực chất là Kafka helper → move vào `kafka/`
- Patterns gộp chung 1 file → cần tách thư mục `patterns/` per-service
- Gateway main.ts thiếu cors, helmet, rate-limit, swagger, ClassSerializerInterceptor
- `libs/dto` chứa domain-specific DTOs → chỉ nên chứa base DTOs

---

## 1. Đơn giản hóa Exception Filters

### `libs/common/src/http/global-exception.filter.ts` — viết lại gọn

- Bỏ `statusToCode()` switch dài → dùng map object
- Bỏ `hasCodeShape()` riêng → inline check
- Gộp logic thành flow đơn giản: UnprocessableEntity → HttpException (có code shape / không) → Error fallback
- Giữ nguyên output shape `HttpErrorResponse`

### `libs/common/src/rpc/rpc-exception.filter.ts` — viết lại gọn

- Bỏ `statusToCode()` switch → dùng cùng map object (extract ra shared util)
- Gộp validation check (BadRequest + Unprocessable) gọn hơn
- Giữ nguyên behavior

### Shared util: `libs/common/src/http/status-code.map.ts`

```ts
const STATUS_CODE_MAP: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_FAILED',
  504: 'UPSTREAM_TIMEOUT',
};

export function statusToCode(status: number): string {
  return STATUS_CODE_MAP[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'CLIENT_ERROR');
}
```

---

## 2. Move `sendRpc` vào `kafka/`, đơn giản hóa

### Move files:

- `libs/common/src/rpc/rpc-client.helper.ts` → `libs/common/src/kafka/kafka-client.helper.ts`
- Rename: `sendRpc` giữ nguyên tên, chỉ đổi location

### Đơn giản hóa `kafka-client.helper.ts`:

- Bỏ nested `err.error` unwrap (quá defensive) → chỉ check top-level `isRpcErrorPayload`
- Giữ: timeout → 504, RpcErrorPayload → HttpException, fallback → 500

### `libs/common/src/rpc/` còn lại:

- `rpc-error.ts` (interface + guard) — giữ
- `rpc.exception.ts` (DomainRpcException) — giữ
- `rpc-exception.filter.ts` — giữ (đã simplify)
- `rpc-client.helper.ts` — XÓA (đã move)
- `index.ts` — bỏ export `rpc-client.helper`

### `libs/common/src/kafka/index.ts` — thêm export `kafka-client.helper`

---

## 3. Patterns → thư mục `patterns/`

### Tạo:

- `libs/common/src/constants/patterns/auth.patterns.ts`
- `libs/common/src/constants/patterns/user.patterns.ts`
- `libs/common/src/constants/patterns/index.ts` (re-export all)

### Xóa:

- `libs/common/src/constants/patterns.ts`

### `libs/common/src/constants/index.ts` — đổi export sang `./patterns`

### Nội dung mỗi file:

```ts
// auth.patterns.ts
export const AUTH_PATTERNS = {
  PING: 'auth.ping',
} as const;

export type AuthPattern = (typeof AUTH_PATTERNS)[keyof typeof AUTH_PATTERNS];
export const ALL_AUTH_PATTERNS = Object.values(AUTH_PATTERNS);
```

---

## 4. Gateway main.ts — enhance

### Cài thêm packages:

```bash
pnpm add helmet express-rate-limit
pnpm add -D @types/express-serve-static-core
```

### Viết lại `apps/api-gateway/src/main.ts`:

- `app.enableCors({ origin: '*' })`
- `expressInstance.set('trust proxy', 1)`
- `app.use(helmet())`
- Rate limit (conditional via env `RATE_LIMIT_ENABLED`)
- `app.useGlobalPipes(new ValidationPipe(...))`
- `app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector))`
- `app.useGlobalFilters(new GlobalHttpExceptionFilter())`
- `setupSwagger(app)` (from `@app/common`)
- `process.send('ready')` for PM2

### Thêm config: `libs/config/src/app.config.ts`

- Thêm fields: `rateLimitEnabled`, `trustProxy`

---

## 5. Swagger setup — `libs/common/src/docs/`

### Tạo:

- `libs/common/src/docs/swagger.ts`
- `libs/common/src/docs/index.ts`

### Nội dung `swagger.ts`:

```ts
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Base Microservice API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);
}
```

### `libs/common/src/index.ts` — thêm `export * from './docs'`

---

## 6. DTO libs — chỉ giữ base

### `libs/dto/src/` chỉ còn:

- `base-response.dto.ts` — `BaseResponseDto` class
- `pagination.dto.ts` — (placeholder cho sau)
- `index.ts` — export base

### Xóa:

- `libs/dto/src/auth/` (toàn bộ thư mục)
- `libs/dto/src/user/` (toàn bộ thư mục)

### Move DTOs vào apps:

- `apps/api-gateway/src/dto/auth/ping.dto.ts` + `ping.response.dto.ts`
- `apps/api-gateway/src/dto/user/ping.dto.ts` + `ping.response.dto.ts`
- (Gateway cần DTOs cho validation + response type)

### Xóa `libs/common/src/http/response.dto.ts` (nếu tồn tại) — `BaseResponseDto` giờ ở `libs/dto`

### Update imports trong gateway service/controller

---

## 7. Cleanup `libs/common/src/http/`

- Xóa `response.dto.ts` (BaseResponseDto moved to libs/dto)
- `index.ts` export: `http-error`, `global-exception.filter`, `status-code.map`

---

## Thứ tự thực hiện

1. Cài packages: `helmet`, `express-rate-limit`
2. Tạo `libs/common/src/http/status-code.map.ts`
3. Simplify `global-exception.filter.ts` và `rpc-exception.filter.ts`
4. Move `sendRpc` → `kafka/kafka-client.helper.ts`, xóa từ `rpc/`
5. Tách patterns → `constants/patterns/`
6. Tạo `libs/common/src/docs/swagger.ts`
7. Update `libs/config/src/app.config.ts` (thêm rateLimitEnabled, trustProxy)
8. Viết lại gateway `main.ts`
9. Restructure `libs/dto` (base only) + move domain DTOs vào gateway
10. Update tất cả imports + index files
11. `pnpm build && pnpm lint`

---

## Files tạo mới

- `libs/common/src/http/status-code.map.ts`
- `libs/common/src/kafka/kafka-client.helper.ts`
- `libs/common/src/constants/patterns/auth.patterns.ts`
- `libs/common/src/constants/patterns/user.patterns.ts`
- `libs/common/src/constants/patterns/index.ts`
- `libs/common/src/docs/swagger.ts`
- `libs/common/src/docs/index.ts`
- `apps/api-gateway/src/dto/auth/ping.dto.ts`
- `apps/api-gateway/src/dto/auth/ping.response.dto.ts`
- `apps/api-gateway/src/dto/user/ping.dto.ts`
- `apps/api-gateway/src/dto/user/ping.response.dto.ts`
- `libs/dto/src/base-response.dto.ts`

## Files xóa

- `libs/common/src/rpc/rpc-client.helper.ts`
- `libs/common/src/constants/patterns.ts`
- `libs/common/src/http/response.dto.ts` (nếu tồn tại)
- `libs/dto/src/auth/` (thư mục)
- `libs/dto/src/user/` (thư mục)

## Files sửa

- `libs/common/src/http/global-exception.filter.ts`
- `libs/common/src/http/index.ts`
- `libs/common/src/rpc/rpc-exception.filter.ts`
- `libs/common/src/rpc/index.ts`
- `libs/common/src/kafka/index.ts`
- `libs/common/src/constants/index.ts`
- `libs/common/src/index.ts`
- `libs/config/src/app.config.ts`
- `apps/api-gateway/src/main.ts`
- `apps/api-gateway/src/api-gateway.service.ts`
- `apps/api-gateway/src/api-gateway.controller.ts`
- `libs/dto/src/index.ts`

## Verification

```bash
pnpm build
pnpm lint
```
