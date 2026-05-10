---
description: Hotfix phạm vi cực hẹp — dập lửa prod
argument-hint: [sự cố đang xảy ra ở prod]
---

Sự cố: **$ARGUMENTS**

## Vai trò

Prod đang cháy. Mục tiêu duy nhất: **ngắt triệu chứng** với diff nhỏ nhất có thể, trong thời gian ngắn nhất có thể. Mọi cải tiến "đẹp hơn" được ghi vào follow-up, không làm tại đây.

## Nguyên tắc sắt

1. **Diff tối thiểu** — càng ít dòng càng tốt. Sửa đúng chỗ đang cháy
2. **Không refactor kèm** — không rename, không split file, không "tiện tay dọn"
3. **Không upgrade dependency** — dù thấy version đã cũ
4. **1 regression test nếu <5 phút** — nếu không kịp, viết TODO + follow-up task
5. **Rollback-safe** — fix phải có thể revert bằng 1 commit nếu lỡ lại vỡ thêm

## Workflow

**Bước 1 — Xác nhận triệu chứng**

- Error message / log nguyên văn từ prod
- Tần suất, phạm vi ảnh hưởng (tất cả user? 1 tenant? 1 endpoint?)
- Từ commit/deploy nào bắt đầu? `git log --oneline -20` nếu cần

**Bước 2 — Quyết định: fix tại đây, hay revert?**

Hỏi rõ trước khi code:

- Có commit gần đây gây ra lỗi không? Nếu có, **revert thường an toàn hơn fix**
- Fix có thể xong trong <30 phút không? Nếu không, revert tạm rồi làm `/fix` tử tế

Nếu user đã chọn fix, tiếp tục.

**Bước 3 — Fix tối thiểu**

- Sửa đúng dòng/hàm gây lỗi
- Nếu cần thêm guard (`if (!x) return`), hợp lệ trong hotfix — nhưng ghi chú "guard tạm, cần xử lý đúng sau"
- Không đụng file không liên quan trực tiếp

**Bước 4 — Verify nhanh**

```bash
nest build <project>                    # build project bị đụng
pnpm jest <spec liên quan>              # test sẵn có phải còn pass
```

Không chạy full test suite nếu phạm vi rõ — tiết kiệm thời gian.

**Bước 5 — Output**

```
### Hotfix: <mô tả 1 dòng>

**Triệu chứng**
<log/error nguyên văn>

**Root cause**
<1–2 câu>

**Change**
- `<file>:<line>` — <sửa gì>

**Verify**
- ✅ build <project>
- ✅ <spec> pass

**Commit message gợi ý**
```

hotfix(<scope>): <mô tả ngắn gọn, <70 ký tự>

```

**Follow-up sau hotfix** (bắt buộc, dù ngắn)
- [ ] <root cause sâu hơn cần sửa đúng>
- [ ] <test regression đầy đủ nếu tạm bỏ qua>
- [ ] <refactor đã né tránh>
```

## Sau hotfix

Nhắc user:

- Verify trên staging/prod sau deploy
- Tạo issue cho follow-up để không quên
- Nếu hotfix đã đụng logic cốt lõi, cân nhắc post-mortem ngắn

## Anti-pattern

- ❌ "Em thấy chỗ này code cũng chưa hay, sửa luôn" — **NO**
- ❌ Bump version package A để fix bug X — trừ khi đã verify A là nguyên nhân
- ❌ Thêm try/catch khổng lồ nuốt mọi lỗi để app ngừng crash
- ❌ Fix nhưng không có commit message rõ — ops cần đọc message để biết đã thay đổi gì
