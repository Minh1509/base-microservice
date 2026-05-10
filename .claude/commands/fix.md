---
description: Fix bug đã xác định — failing test trước, sửa sau
argument-hint: [mô tả bug]
---

Bug cần fix: **$ARGUMENTS**

## Vai trò

Bug fix **phạm vi hẹp**. Không refactor, không dọn code xung quanh trừ khi nó là nguyên nhân trực tiếp.

Phân biệt:

- Bug **đã rõ nguyên nhân** → dùng `/fix` (lệnh này)
- Bug **chưa rõ tại sao** → dùng `/debug` để điều tra trước

Nếu đọc mô tả mà chưa biết root cause, dừng lại chạy `/debug` thay vì đoán.

## Workflow

**Bước 1 — Confirm understanding** (30s)

- Đọc code path đang lỗi: entry (controller/RMQ handler) → service → dependency
- Đọc spec hiện có xung quanh để biết hành vi "đúng" là gì
- Nếu mô tả user mơ hồ, hỏi lại 1 câu rõ ràng

**Bước 2 — Viết failing test trước**

- Chọn đúng file spec: `<file>.spec.ts` cạnh file nguồn
- Test phải **fail vì chính bug này**, không fail vì setup sai
- Chạy `pnpm jest <file.spec.ts> -t "<test name>"` để xác nhận nó fail đúng lý do
- Nếu không viết được test (ví dụ bug chỉ xảy ra với real RabbitMQ), ghi rõ và dùng manual repro thay thế

**Bước 3 — Fix tối thiểu**

- Sửa đúng root cause. Không "tiện tay" đổi thêm thứ khác
- Giữ public API cũ nếu có thể. Nếu buộc phải đổi, flag trong output
- Không thêm try/catch bao ngoài để "phòng" — xử lý đúng lỗi thực

**Bước 4 — Verify**

```bash
pnpm jest <file.spec.ts>                # test target phải pass
pnpm jest <related-dir>                 # spec xung quanh vẫn pass
pnpm lint                               # nếu đổi >3 file
nest build <project>                    # nếu đụng module wiring
```

**Bước 5 — Output**

```
### Fix: <mô tả ngắn>

**Root cause**
<1–3 câu, nói rõ *tại sao* sai, không chỉ *chỗ nào* sai>

**Changes**
- `<file>` — <sửa gì>
- `<spec file>` — thêm test case `<name>`

**Verify**
- ✅ Test mới pass (trước đó fail đúng vì bug)
- ✅ Test liên quan còn pass
- <lint/build nếu có chạy>

**Tác động ngoài phạm vi**
- <nếu đổi public API hoặc DB shape, flag tại đây>
- None — nếu không có
```

## Anti-pattern

- ❌ "Em thêm `if (x == null) return` cho chắc" — đó là che giấu bug, không phải fix
- ❌ "Em đổi luôn cách naming cho đồng bộ" — không thuộc phạm vi, ra PR riêng
- ❌ Fix xong không viết test → bug sẽ quay lại
- ❌ Test pass nhưng chỉ vì đã mock vừa khít lỗi cũ — test phải còn ý nghĩa sau khi fix
