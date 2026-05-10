---
description: Viết hoặc chạy test — unit, e2e, by name, coverage
argument-hint: [file path | tên feature | "all" | "e2e"]
---

Target: **$ARGUMENTS**

## Mở đầu — phân loại target

Đọc `$ARGUMENTS`:

- Trống hoặc `"all"` → chạy toàn bộ unit: `pnpm test`
- `"e2e"` → hỏi user app nào, rồi `pnpm jest --config apps/<app>/test/jest-e2e.json`
- Path `*.spec.ts` / thư mục → chạy file/dir đó
- Path source `.ts` (không có spec) → **viết spec** cho file đó
- Feature description (không phải path) → tìm file liên quan, viết spec

Nếu mơ hồ, hỏi 1 câu rõ ràng trước khi chạy.

## Cheat sheet lệnh

```bash
pnpm test                                          # tất cả unit
pnpm jest <path/to/file.spec.ts>                   # 1 file
pnpm jest -t "partial test name"                   # match theo tên describe/it
pnpm jest --config apps/api-gateway/test/jest-e2e.json     # e2e api-gateway
pnpm jest --config apps/auth-service/test/jest-e2e.json    # e2e auth-service
pnpm jest --config apps/user-service/test/jest-e2e.json    # e2e user-service
pnpm test:cov                                      # coverage report → ./coverage
pnpm test:watch                                    # watch mode
```

Config Jest inline trong `package.json`:

- `testRegex`: `.*\.spec\.ts$`
- `roots`: `apps/`, `libs/`
- `moduleNameMapper`: alias `@app/*` đã có — nếu thêm lib mới, thêm mapping tại đây

## Khi viết spec mới

**Vị trí file** — cạnh file nguồn: `user.service.ts` → `user.service.spec.ts`

**Template cho Nest service**

```ts
import { Test } from '@nestjs/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let repo: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: { save: jest.fn(), findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get(UserService);
    repo = module.get(UserRepository);
  });

  it('creates user when email is unique', async () => {
    /* ... */
  });
  it('throws ConflictException when email exists', async () => {
    /* ... */
  });
});
```

**Template cho Nest controller** — dùng `overrideProvider` mock service.

**Template cho RMQ handler** (`auth-service`): test handler như một method thường, không cần boot real transport.

## Coverage mục tiêu mỗi spec

Tối thiểu cho một unit đáng viết:

- ✅ Happy path
- ✅ Ít nhất 1 error case thật (throw, invalid input, dependency fail)
- ✅ Edge case logic (boundary value, empty, null nếu cho phép)

Bỏ qua:

- ❌ Getter/setter tầm thường
- ❌ Test chỉ để cover line mà không assert gì có nghĩa

## Workflow khi chạy

1. Chạy lệnh phù hợp
2. Nếu có fail:
   - Đọc error, phân loại: **code sai** hay **test sai**
   - Nếu code sai và bug rõ → chuyển sang `/fix`
   - Nếu test sai (giả định cũ đã lỗi thời, ví dụ API thay đổi) → sửa test, ghi chú trong output
3. Báo cáo:

```
### Test run: <target>

- <n> passed / <m> failed / <k> skipped
- Time: <s>s

**Failures (nếu có)**
- `<file> › <test name>` — <tóm tắt lý do>
```

## Anti-pattern

- ❌ Test mock luôn cả object under test (`service = { method: jest.fn(() => 'ok') }`) → vô nghĩa
- ❌ `expect(true).toBe(true)` hoặc assertion luôn đúng
- ❌ `test.skip` / `test.todo` mà không có TODO comment cụ thể
- ❌ Report "pass" khi thực ra chỉ skip qua — **đọc output đến dòng summary**
