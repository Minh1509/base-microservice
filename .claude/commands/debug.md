---
description: Điều tra lỗi chưa rõ nguyên nhân — bằng chứng trước, fix sau
argument-hint: [symptom / error message / stack trace]
---

Symptom: **$ARGUMENTS**

## Vai trò

Chế độ **điều tra viên**, không phải thợ sửa. Mục tiêu là tìm **root cause** và báo cáo cho user. Chỉ apply fix khi user xác nhận, hoặc khi bug **nhỏ và đã chắc chắn** root cause.

## Nguyên tắc

- **Bằng chứng > Giả thuyết > Trực giác**. Không "chắc là do X đấy, em sửa luôn"
- Một giả thuyết chỉ hợp lệ khi có cách verify/falsify
- Khi bị chặn 2 lần bởi cùng một loại lỗi, **lùi lại xem lại giả thuyết** thay vì tweak tiếp

## Workflow

**Bước 1 — Thu thập triệu chứng**

- Error message nguyên văn, stack trace đầy đủ
- Reproduce như thế nào (endpoint nào, payload nào, env nào)
- Xảy ra mọi lần hay flaky? Từ khi nào? (`git log` commit gần nhất đụng vùng đó)

**Bước 2 — Reproduce cục bộ**

Tùy app:

- **HTTP** (`api-gateway`, `user-service`): `pnpm dev`, gọi bằng curl
  ```bash
  curl -i -X POST http://localhost:3000/<endpoint> -d '...'
  ```
- **RMQ** (`auth-service`): cần RabbitMQ listening ở `amqp://guest:guest@localhost:5602` (queue `auth_queue`, durable). Gọi qua gateway `ClientProxy`, không gọi trực tiếp HTTP vì auth-service không có HTTP surface
- **Test**: `pnpm jest <spec>` để reproduce nhanh hơn

Nếu không reproduce được → ghi rõ, đây đã là một phát hiện.

**Bước 3 — Trace code path**

Đi dọc chain dưới góc nhìn dữ liệu:

```
Entry (controller / @MessagePattern)
   ↓ DTO validation
   ↓ Service logic
   ↓ Lib (@app/database, @app/config, ...)
   ↓ External (DB, Redis, AMQP)
```

Tại mỗi bước, trả lời: **state ở đây là gì, có đúng như giả định không?**

**Bước 4 — Đặt log có chủ đích (nếu cần)**

- Chỉ log ở điểm không reason được bằng static read
- Dùng `console.log` tạm OK, nhưng **nhớ xóa hết** trước khi finish
- Ưu tiên chạy lại test/curl thay vì log nếu static đủ kết luận

**Bước 5 — Kết luận**

Trình báo cáo theo template. **Không apply fix trừ khi fix nhỏ + chắc chắn**.

## Output template

```
### Điều tra: <symptom>

**Reproduce**
- ✅ Reproduced: <cách reproduce cụ thể>
- hoặc ❌ Không reproduce local: <mô tả khác biệt environment>

**Root cause (bằng chứng)**
<2–5 câu, chỉ ra file:line cụ thể và tại sao nó sai>

**Các giả thuyết đã loại**
- <giả thuyết A> — loại vì <bằng chứng>
- <giả thuyết B> — loại vì <bằng chứng>

**Đề xuất fix**
<Mô tả. Nếu trivial + chắc chắn, hỏi "Mình fix luôn?" hoặc apply kèm note.>

**Câu hỏi mở**
- <nếu còn chỗ chưa chắc>
- None — nếu đã rõ tất cả
```

## Hints theo loại lỗi hay gặp trong repo

- **`Cannot find module '@app/...'`** → alias chưa sync giữa `tsconfig.json` / `package.json` jest / `nest-cli.json`
- **Message gửi sang auth-service mất tích** → URL/queue/durable không khớp giữa `ClientProxy` và `auth-service/src/main.ts`
- **Port 3000 đã sử dụng** → gateway và user-service cùng default 3000, set `PORT` khác
- **Validation không chạy** → quên `app.useGlobalPipes(new ValidationPipe(...))` trong `main.ts`
- **Test fail với "Cannot find module"** mà code chạy được → `jest.moduleNameMapper` thiếu alias mới
