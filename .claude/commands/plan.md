---
description: Lên kế hoạch triển khai trước khi viết code — research only, không sửa file
argument-hint: [mô tả task]
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git diff:*), Bash(ls:*)
---

Task cần lên plan: **$ARGUMENTS**

## Vai trò

Bạn đang ở **chế độ kiến trúc sư**. Nhiệm vụ là research rồi trình plan cho user duyệt. **Không** được Edit/Write code trong lệnh này — kể cả code nhỏ. Nếu user muốn bạn làm luôn, họ sẽ chạy `/cook` hoặc `/fix`.

## Bối cảnh repo (nhớ khi plan)

- **Monorepo NestJS** với 3 app + 4 lib. Xem `CLAUDE.md` nếu cần refresh
- 3 app **không chia sẻ transport**:
  - `api-gateway` — HTTP, `process.env.port ?? 3000`
  - `user-service` — HTTP, `process.env.port ?? 3000` (⚠ trùng port với gateway)
  - `auth-service` — **RabbitMQ** (`Transport.RMQ`, URL `amqp://guest:guest@localhost:5602`, queue `auth_queue`, durable)
- 4 lib `@app/common | @app/config | @app/database | @app/dto` — import qua alias, **không bao giờ** qua relative path từ `apps/` sang `libs/`
- Thêm lib mới = phải sync alias ở **3 nơi**: `tsconfig.json` (`paths`), root `package.json` (`jest.moduleNameMapper`), `nest-cli.json` (`projects`)

## Workflow

**Bước 1 — Khoanh vùng**

- Glob/Grep các keyword liên quan để tìm file hiện có
- Đọc các file đó (controller, module, service, spec) để hiểu pattern đang dùng
- Nếu task nhắc tên bảng / entity / queue / endpoint, grep nguyên chuỗi đó trước khi đoán

**Bước 2 — Trả lời các câu hỏi định hướng**

- Feature/change này thuộc app nào? Nếu cross-service, **transport nào** nối chúng?
- Có DTO chung không? → cân nhắc đặt vào `@app/dto` để 2 bên cùng import
- Có cần entity / typeorm repo không? → vị trí trong `@app/database`
- Có biến môi trường mới không? → khai báo ở đâu, default là gì
- Có breaking change với client hiện có không?

**Bước 3 — Viết plan**

Dùng đúng template dưới, **không bỏ section nào**. Nếu một section không áp dụng, ghi "N/A" kèm lý do.

```
## Plan: <tên ngắn gọn>

### Mục tiêu
<1–2 câu, viết theo góc nhìn user/system đạt được gì>

### Files sẽ tạo/sửa
- `apps/<app>/src/<path>` — <sửa gì>
- `libs/<lib>/src/<path>` — <sửa gì>

### Module wiring
- Import/export nào thay đổi trong module nào
- Nếu cross-service: `ClientsModule.register([...])` ở app nào, config URL/queue ra sao
- Nếu thêm lib mới: liệt kê 3 chỗ alias cần sync

### DTO & validation
- DTO nào, field nào, validator decorator nào
- `ValidationPipe` đã bật ở ranh giới input chưa

### Test plan
- Unit spec (file + case chính)
- E2E (nếu cần) — qua `apps/<app>/test/jest-e2e.json`

### Rủi ro & câu hỏi mở
- Rủi ro: <race condition, migration, backward compat, ...>
- Cần user quyết: <những điểm bạn không tự quyết được>

### Ước lượng phạm vi
Nhỏ (<50 LOC) / Vừa (50–300) / Lớn (>300, đề xuất tách PR)
```

**Bước 4 — Dừng**

Kết câu bằng: _"Plan trên ổn chưa? Mình đợi duyệt trước khi implement."_ Không chạy tiếp.

## Chống anti-pattern

- ❌ "Mình sẽ tạo `user.service.ts` với method `create`, `update`..." — quá vague
- ✅ "`apps/user-service/src/user.service.ts` thêm method `create(dto: CreateUserDto): Promise<User>` gọi `UserRepository.save`, ném `ConflictException` khi email trùng"
- ❌ Plan dài 5 trang, user phải đọc 10 phút — thu gọn lại
- ❌ Plan 2 dòng "sẽ thêm endpoint X" — thiếu wiring, thiếu test
