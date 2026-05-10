---
description: Dọn working tree — log thừa, import dead, format, lint — trước khi commit
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(git status), Bash(git diff:*), Bash(pnpm format), Bash(pnpm lint), Bash(nest build:*)
---

## Vai trò

Dọn dẹp **trước khi commit / tạo PR**. Không tự commit — để user review rồi commit.

## Workflow

**Bước 1 — Xem phạm vi**

```bash
git status
git diff            # chỉ file đã modify, chưa stage
git diff --cached   # file đã stage
```

Chỉ dọn các file xuất hiện trong diff. Không rà toàn bộ repo.

**Bước 2 — Rà từng loại rác (theo checklist)**

### 2.1. Log & debug leftover

Grep trong các file đã đổi:

- `console.log` / `console.debug` / `console.info` không phải logger chính thức
- `debugger` statement
- `print(...)` (nếu có file non-TS)
- Log có prefix như `>>>`, `TEST`, `WTF`, `ABC`

⚠ Giữ lại: `console.error` / `console.warn` nếu nó là error handling thật sự, và Logger của `@nestjs/common` (`Logger.log(...)`).

### 2.2. TODO/FIXME mới thêm

- Grep `TODO|FIXME|XXX|HACK` trong diff
- Với mỗi cái:
  - Hoặc giải quyết ngay (nếu trivial)
  - Hoặc kèm mô tả rõ ràng + issue link
  - Hoặc convert thành follow-up task

### 2.3. Import / biến dead

- Biến khai báo không đọc
- Function export không ai import

### 2.4. Code comment-out từ khi debug

```ts
// const result = await service.doThing();
// console.log(result);
```

→ Xóa sạch. Nếu muốn giữ để tham khảo, đưa vào commit message hoặc note trên PR.

### 2.5. File tạm

- `*.tmp`, `*.bak`, `.DS_Store`, `Thumbs.db`
- Script debug tự viết (`test.ts`, `tmp.ts` ở root)
- Snapshot/dump vô tình commit

### 2.6. Secret leak check

Grep nhanh trong diff:

- `password\s*[:=]\s*['"]` (không phải tên field)
- Key pattern: `sk_live`, `AKIA[0-9A-Z]{16}`, `-----BEGIN`
- URL có credential inline: `://user:pass@`

Nếu thấy → flag ngay với user, **không tự commit**.

**Bước 3 — Chạy format & lint**

```bash
pnpm format        # prettier apps/**/*.ts libs/**/*.ts
```

**Bước 4 — Smoke build** (nếu đụng nhiều file)

```bash
nest build <project bị ảnh hưởng nhiều nhất>
```

**Bước 5 — Output**

```
### Cleanup report

**Đã xóa/sửa**
- `<file>` — xóa n console.log
- `<file>` — xóa import dead
- ...

**Cố tình giữ lại**
- `<file>:<line>` — <Logger chính thức> / <error handling thật>

**Format & lint**
- ✅ pnpm format: <n file changed>

**Cảnh báo** (nếu có)
- ⚠ Phát hiện <tên file> có dấu hiệu secret — cần user xác nhận

**Sẵn sàng commit**: ✅ / ❌ (vì …)
```

## Lưu ý tên lệnh

`/clear` là built-in của Claude Code để **xóa lịch sử conversation**. Lệnh này tên `/cleanup` để tránh nhầm lẫn. Muốn reset hội thoại → dùng `/clear`. Muốn dọn code → dùng `/cleanup`.

## Anti-pattern

- ❌ Tự chạy `git commit` cuối lệnh — user phải review trước
- ❌ Xóa log mà không phân biệt log debug vs log chính thức
- ❌ Đụng file không có trong diff — ngoài phạm vi
- ❌ Auto-fix lint bằng `--fix` ở toàn repo → sẽ đụng file người khác
