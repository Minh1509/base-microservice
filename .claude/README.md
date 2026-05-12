# .claude Workspace Guide

Tài liệu này mô tả công dụng của từng thư mục trong `.claude`, cách chúng phối hợp với nhau, và cách dùng đúng để giữ chất lượng + tối ưu token/context.

## Mục tiêu của `.claude`

` .claude` là lớp điều phối hành vi cho AI agent trong dự án, gồm:

- Guardrails kỹ thuật và bảo mật.
- Ngữ cảnh dự án có cấu trúc.
- Workflow tái sử dụng qua commands/skills.
- Hook tự động trước/sau khi agent dùng tool.
- Bộ nhớ quyết định kiến trúc theo thời gian.

## Cấu trúc thư mục

### `commands/`

Chứa prompt shortcut theo tác vụ lặp lại.

- Ví dụ: `review.md`, `fix.md`, `refactor.md`, `resume.md`, `checkpoint.md`.
- Dùng khi muốn tiêu chuẩn hóa cách gọi tác vụ (không phải viết prompt dài mỗi lần).
- Nên giữ format ngắn, rõ scope, có đầu ra kỳ vọng.

Khi nào dùng:

- Team có thao tác lặp thường xuyên.
- Cần đồng bộ cách đặt yêu cầu cho agent giữa nhiều thành viên.

Không nên:

- Nhét toàn bộ policy dài vào command file.
- Trùng nội dung với `rules/` hoặc `context/`.

### `context/`

Chứa kiến thức nền về hệ thống và domain để agent hiểu đúng bài toán.

- Ví dụ: `project.md`, `backend-architecture.md`, `service-map.md`, `domain-glossary.md`, `common-workflows.md`.
- Mục tiêu: giảm đọc lan man trong codebase khi xử lý task nghiệp vụ.

Khi nào dùng:

- Bắt đầu phiên làm việc mới.
- Task đụng nhiều module, domain logic, dependency flow.

Không nên:

- Viết theo dạng tài liệu marketing.
- Chứa quy tắc bắt buộc (đưa sang `rules/`).

### `hooks/`

Chứa script tự động chạy theo lifecycle của Claude Code.

- `SessionStart`: khởi tạo context/checkpoint.
- `UserPromptSubmit`: nhắc rule trước khi xử lý yêu cầu.
- `PreToolUse`: chặn hành vi rủi ro trước read/write/edit/bash.
- `PostToolUse`: tự review/simplify/update checkpoint sau chỉnh sửa.

Mục tiêu:

- Enforce chuẩn team mà không phụ thuộc kỷ luật thủ công.
- Giảm sai sót khi thao tác file nhạy cảm.

Khi nào dùng:

- Luôn bật trong môi trường phát triển có policy rõ.

Không nên:

- Thực thi logic nặng, chậm, hoặc phụ thuộc mạng không cần thiết.
- Viết hook gây false-positive liên tục làm cản trở workflow.

### `hooks/lib/`

Thư viện dùng chung cho hooks và statusline.

- Ví dụ: `privacy-checker`, `project-detector`, `transcript-parser`, `git-info-cache`, `ck-config-utils`.
- Mục tiêu: tách logic reusable khỏi file hook entrypoint.

Khi nào dùng:

- Có nhiều hook cần chung parser/checker/util.
- Cần test được logic cốt lõi độc lập.

Không nên:

- Để hook entrypoint chứa toàn bộ logic mà không tách module.

### `mcp/`

Chứa cấu hình MCP tools.

- Ví dụ: `mcp.json` để khai báo server/tool integration.
- Mục tiêu: mở rộng capability của agent có kiểm soát (filesystem/db/...).

Khi nào dùng:

- Cần tool external ổn định và có policy truy cập rõ ràng.

Không nên:

- Bật quá nhiều MCP không dùng đến.
- Cấu hình quyền truy cập rộng hơn nhu cầu thực tế.

### `memory/`

Bộ nhớ dài hạn của dự án cho agent.

- `architecture-decisions.md`: quyết định kiến trúc đã chốt.
- `naming-conventions.md`: quy ước đặt tên.
- `checkpoints/current.md`: trạng thái làm việc hiện tại.
- `checkpoints/handoff.md`: bàn giao giữa phiên/người.

Mục tiêu:

- Tránh lặp lại tranh luận đã chốt.
- Giữ continuity khi đổi người hoặc đổi phiên.

Khi nào dùng:

- Sau mỗi thay đổi lớn.
- Trước khi bàn giao hoặc resume task.

Không nên:

- Ghi nhật ký vụn vặt không có giá trị ra quyết định.

### `rules/`

Nguồn policy kỹ thuật bắt buộc.

- Ví dụ: `security.md`, `architecture.md`, `api.md`, `database.md`, `testing.md`, `logging.md`, `nestjs.md`.
- Mục tiêu: tạo “definition of done” nhất quán.

Khi nào dùng:

- Trước khi code/review.
- Là baseline để hooks hoặc commands tham chiếu.

Không nên:

- Viết rule mơ hồ, không kiểm chứng được.
- Trộn kiến thức bối cảnh (đưa sang `context/`).

### `skills/`

Playbook theo loại công việc.

- Ví dụ taxonomy: debug, design, optimize, review, test...
- Mục tiêu: chuẩn hóa quy trình thực thi từng dạng task.

Khi nào dùng:

- Task có pattern lặp lại và cần checklist chuẩn.

Không nên:

- Tạo skill trùng lặp khác tên nhưng cùng nội dung.
- Để skill dài như tài liệu tổng quan hệ thống.

### `templates/`

Mẫu artifact chuẩn hóa để agent sinh đầu ra đồng nhất.

- Ví dụ: ADR template, incident template, PR review template.
- Mục tiêu: giảm độ biến thiên format giữa các thành viên.

Khi nào dùng:

- Cần tài liệu có cấu trúc lặp lại.

Không nên:

- Để template chứa nội dung đặc thù của 1 task cụ thể.

## Quan hệ giữa các phần

- `rules/`: bắt buộc (policy).
- `context/`: kiến thức nền (understanding).
- `commands/` và `skills/`: cách thực thi (workflow).
- `hooks/`: tự động enforcement.
- `memory/`: continuity theo thời gian.
- `templates/`: chuẩn hóa đầu ra.
- `mcp/`: năng lực tool.

## Nguyên tắc tối ưu token/context

1. Chỉ nạp ngữ cảnh theo nhu cầu task.
2. Ưu tiên đọc `rules` cốt lõi trước, `context` theo domain sau.
3. Không preload toàn bộ `skills` nếu không liên quan.
4. Tách policy (`rules`) khỏi mô tả (`context`) để tìm đúng file nhanh.
5. Giữ file ngắn, heading rõ, dễ grep.
6. Hooks chỉ làm việc lightweight, deterministic, timeout thấp.

## Gợi ý vận hành base trước khi fill data

1. Đảm bảo mọi path trong `settings.json` đều tồn tại.
2. Mỗi thư mục có ít nhất 1 `README` mô tả contract.
3. Hook entrypoint có thể chạy được dù logic chưa hoàn thiện (không crash).
4. Chuẩn hóa UTF-8 cho toàn bộ file markdown/script.
5. Tránh duplicate nội dung giữa `rules`, `context`, `skills`.
