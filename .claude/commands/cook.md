---
description: Build feature end-to-end theo pattern repo, không để dở nửa chừng
argument-hint: [mô tả feature]
---

Feature cần build: **$ARGUMENTS**

## Vai trò

Implement feature từ đầu đến cuối. Không dừng ở "đã tạo file, user tự wire module nhé" — wire xong, test xong, build xong mới báo done.

## Trước khi code — 30 giây checklist

1. Feature này thuộc **app nào**? (`api-gateway` | `user-service` | `auth-service`)
2. Có **cross-service call** không?
   - Gateway → auth-service = **RMQ** qua `ClientProxy`, queue `auth_queue`
   - Gateway → user-service = **HTTP** (hiện tại chưa có pattern cố định, hỏi user)
3. DTO dùng chung 2 chỗ? → đặt trong `@app/dto`
4. Có entity / repo mới? → trong `@app/database`
5. Có biến env mới? → `.env.example` + `@app/config` (khi config service được hoàn thiện)

Nếu bất kỳ câu nào mơ hồ, **hỏi user trước khi code**.

## Pattern chuẩn trong repo

**Controller — mỏng, chỉ routing + validation**

```ts
@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }
}
```

**Service — chứa logic**

```ts
@Injectable()
export class UserService {
  constructor(private readonly repo: UserRepository) {}
  async create(dto: CreateUserDto): Promise<User> {
    /* ... */
  }
}
```

**DTO — `class-validator` decorators**

```ts
export class CreateUserDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
}
```

**RMQ handler trong `auth-service`**

```ts
@MessagePattern({ cmd: 'auth.login' })
login(@Payload() dto: LoginDto) { /* ... */ }
```

**RMQ client trong `api-gateway`**

```ts
ClientsModule.register([
  {
    name: 'AUTH_SERVICE',
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://guest:guest@localhost:5602'],
      queue: 'auth_queue',
      queueOptions: { durable: true },
    },
  },
]);
```

⚠ URL + queue + durable **phải khớp** với `apps/auth-service/src/main.ts`. Lệch 1 ký tự là message rơi vào void.

## Workflow

1. **Lập kế hoạch ngầm** (không cần output, chỉ nghĩ): file nào tạo, file nào sửa, test nào viết
2. **Implement theo thứ tự**: DTO → Service (logic) → Controller/Handler → Module wiring → Spec
3. **Wire module**: import lib module vào app module, thêm provider/controller mới, `ClientsModule` nếu cross-service
4. **Nếu thêm lib mới** — bắt buộc sync 3 chỗ alias:
   - `tsconfig.json` → `compilerOptions.paths`
   - `package.json` → `jest.moduleNameMapper`
   - `nest-cli.json` → `projects`
5. **Viết spec** cạnh file gốc (`*.spec.ts`). Cover happy path + ít nhất 1 error case thật
6. **Verify** (bắt buộc trước khi báo done):
   - `pnpm build` cho app bị đụng: `nest build <project>`
   - `pnpm jest <path/to/spec>` cho spec mới
   - `pnpm lint` nếu đổi >3 file
7. **Báo cáo** (template dưới)

## Output template

```
### Đã build: <tên feature>

**Files changed**
- M `apps/<app>/src/<file>` — <sửa gì>
- A `libs/<lib>/src/<file>` — <tạo gì>

**Wiring**
- <module/lib mới được import ở đâu>
- <ClientProxy config nếu có>

**Verify**
- ✅ `nest build <project>` — pass
- ✅ `pnpm jest <path>` — <n> pass
- ⚠ lint: <warning còn lại nếu có>

**Chưa làm / cố tình bỏ**
- <nếu có, kèm lý do>
```

## Guardrails

- ❌ Đừng thêm abstraction "phòng hờ". YAGNI.
- ❌ Đừng copy-paste code sang app khác khi có thể đặt vào `@app/*`
- ❌ Đừng bỏ qua validation vì "tí nữa làm"
- ❌ Đừng dùng `any` nếu có type cụ thể
- ✅ Match code style xung quanh (single quote, trailing comma — Prettier lo)
- ✅ Nếu build/test fail, **fix trước khi báo cáo**, đừng báo "pass" rồi chú thích "có 1 test fail nhỏ"
