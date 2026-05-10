---
description: Review diff branch hiện tại như senior engineer
allowed-tools: Read, Glob, Grep, Bash(git status), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git branch:*), Bash(pnpm lint), Bash(nest build:*)
---

## Vai trò

Senior engineer review. Thẳng thắn, có căn cứ, phân loại rõ. Không khen suông, không nit vặt vãnh khi không quan trọng.

## Workflow

**Bước 1 — Nắm diff**

```bash
git status                          # untracked / modified
git branch --show-current
git log main..HEAD --oneline        # commits trên branch này
git diff main...HEAD                # toàn bộ thay đổi vs main
# nếu chưa commit: git diff
```

**Bước 2 — Rà theo checklist (theo thứ tự quan trọng)**

### A. Correctness & logic

- Có đúng ý đồ mô tả trong commit/PR không?
- Edge case nào đã bỏ sót? (empty, null, concurrency, large input)
- Có path nào **không reachable** hoặc **luôn false/true**?
- Async có `await` đủ chỗ? Promise nào dangling? (`no-floating-promises` chỉ là warn)

### B. Transport & monorepo boundary

- App nào được sửa? Transport đúng chưa?
  - HTTP app mà add `@MessagePattern` → sai chỗ
  - `auth-service` mà add `@Controller` nghe HTTP → sai (nó là microservice RMQ thuần)
- Cross-service call: `ClientProxy` config URL + queue + durable có **khớp** với `apps/auth-service/src/main.ts`? Lệch = message mất tích
- Code dùng chung giữa app có nên đẩy vào `@app/*` lib không?

### C. Module wiring

- Provider mới đã khai báo trong module?
- Controller mới có trong `controllers: []`?
- Lib mới → đã sync alias ở **3 chỗ**? (`tsconfig.json`, `package.json` jest.moduleNameMapper, `nest-cli.json`)

### D. DTO & validation

- Input từ external (HTTP body, RMQ payload) có DTO với `class-validator`?
- `ValidationPipe` đã bật ở `main.ts`?
- DTO dùng chung giữa gateway và service → trong `@app/dto`

### E. Tests

- Có spec cho logic mới không?
- Test **thật sự** test logic, hay chỉ check mock? (xem `/test` để biết anti-pattern)
- E2E nếu chạm endpoint public

### F. Security

- Không log secret (password, token, cookie)
- Không interpolate user input vào raw SQL / shell
- Không đọc/trả về `.env` qua API
- Password được hash trước khi lưu (nếu đụng user/auth)
- JWT / session có expire hợp lý

### G. Style & noise

- Prettier sạch (single quote, trailing comma)
- Không `console.log` sót lại
- Không import thừa, không biến dead
- Không comment code-đã-xóa
- Không `any` ở chỗ có type cụ thể được

### H. Docs & migration

- Có thay đổi API public? → cần cập nhật client/consumer?
- Có thêm env var? → `.env.example` được cập nhật?
- Breaking change? → flag rõ

**Bước 3 — Chạy check tự động**

```bash
pnpm lint
nest build <project đang review>
```

**Bước 4 — Output**

```
### Review: <branch name> vs main

**Tóm tắt**
<1–3 câu: làm gì, có OK merge không>

**Must-fix (blocker)**
- [ ] `<file>:<line>` — <vấn đề>
<nếu rỗng: ghi "None">

**Should-fix (nên sửa trước merge)**
- [ ] `<file>:<line>` — <vấn đề>

**Nit (tùy chọn)**
- `<file>:<line>` — <góp ý>

**Điểm tốt**
- <nếu có điểm đáng học hỏi, nêu ngắn>

**Build/lint**
- lint: <clean | n warnings>
- build: <✅ | ❌ message>

**Verdict**: ✅ Approve / ⚠ Approve with changes / ❌ Request changes
```

## Nguyên tắc phân loại

- **Must-fix**: sai correctness, security hole, break build, break existing test, vi phạm contract đã công bố
- **Should-fix**: test thiếu, edge case rõ ràng chưa cover, code khó maintain dài hạn, không theo convention repo
- **Nit**: naming, style nhỏ, cá nhân subjective

## Anti-pattern

- ❌ "LGTM!" 2 chữ — không mang lại giá trị
- ❌ List 30 nit nhưng bỏ sót 1 blocker
- ❌ Rewrite theo phong cách cá nhân nếu convention repo khác
- ❌ Khen cho có — nếu không có điểm tốt rõ ràng, bỏ qua section đó
