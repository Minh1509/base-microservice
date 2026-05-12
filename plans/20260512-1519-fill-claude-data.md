# Plan: Fill data cho toàn bộ .claude/

## Goal

Fill nội dung thực tế vào tất cả file skeleton trong `.claude/` theo thứ tự ưu tiên, từ những file ảnh hưởng nhiều nhất (inject mỗi session) đến ít nhất (templates, hooks).

## Context

- Cấu trúc `.claude/` đã được setup đầy đủ và chuẩn
- `CLAUDE.md` đã có nội dung hoàn chỉnh — không duplicate vào `context/` hay `rules/`
- Tất cả file hiện chỉ có 1 dòng heading hoặc skeleton rỗng
- Hook infrastructure (`lib/`, `scout-block/`) đã có implementation thực
- Entrypoint hooks (9 files) vẫn là placeholder 1 dòng
- `plans/` chưa tồn tại — tạo mới trong task này

## Approach

Fill theo 6 tier từ high-impact đến low-impact. Mỗi tier độc lập, có thể dừng sau bất kỳ tier nào và hệ thống vẫn hoạt động tốt hơn trước. Tier 1–2 là MVP để team dùng được ngay.

## Steps

### Tier 1 — Rules & Context (inject mỗi session)

- [ ] 1. Fill `rules/development-rules.md` — naming conventions, error handling, config pattern, DTO placement, validation, logging rules
- [ ] 2. Fill `rules/security.md` — OWASP checklist cho NestJS+Kafka, secrets, auth guard, input validation, RPC boundary
- [ ] 3. Fill `context/domain-glossary.md` — business terms, entity names, service abbreviations, domain concepts

### Tier 2 — Commands (workflow hàng ngày)

- [ ] 4. Fill `commands/fix.md` — prompt debug: đọc error → trace → root cause → minimal fix
- [ ] 5. Fill `commands/review.md` — checklist: architecture, security, naming, test, breaking change
- [ ] 6. Fill `commands/refactor.md` — scope rõ, không đổi behavior, follow patterns
- [ ] 7. Fill `commands/new-feature.md` — scaffold đầy đủ: module/controller/service/DTO/pattern/migration
- [ ] 8. Fill `commands/checkpoint.md` — lưu trạng thái vào `memory/checkpoints/current.md`
- [ ] 9. Fill `commands/resume.md` — đọc checkpoint, tiếp tục đúng chỗ

### Tier 3 — Skills (theo loại task)

- [ ] 10. Fill `skills/generate-feature/skill.md` — checklist đầy đủ nhất: DTO → entity → migration → pattern → handler → gateway
- [ ] 11. Fill `skills/design-api/skill.md` — DTO shape, swagger, response envelope, validation
- [ ] 12. Fill `skills/design-db-migration/skill.md` — impact analysis, up/down, index, rollback
- [ ] 13. Fill `skills/debug-rpc/skill.md` — trace Kafka: pattern registry, subscribeToResponseOf, timeout, error envelope
- [ ] 14. Fill `skills/write-tests/skill.md` — unit/integration/e2e cho NestJS+Kafka stack
- [ ] 15. Fill `skills/review-pr/skill.md` — checklist review PR
- [ ] 16. Fill `skills/refactor-backend/skill.md` — quy trình refactor an toàn
- [ ] 17. Fill `skills/debug-production/skill.md` — log query, trace id, rollback decision
- [ ] 18. Fill `skills/optimize-query/skill.md` — MikroORM slow query, explain plan, index
- [ ] 19. Fill `skills/security-review/skill.md` — OWASP cho NestJS+Kafka

### Tier 4 — Memory (fill theo thực tế dự án)

- [ ] 20. Fill `memory/team-conventions.md` — git flow, branch naming, commit format, PR rules
- [ ] 21. Fill `memory/architecture-decisions.md` — ADR: tại sao Kafka, MikroORM, monorepo, pnpm
- [ ] 22. Fill `memory/known-issues.md` — bug đã biết, workaround, limitation

### Tier 5 — Templates

- [ ] 23. Fill `templates/adr.md` — ADR template: Status, Context, Decision, Consequences
- [ ] 24. Fill `templates/pr-review.md` — PR review template
- [ ] 25. Fill `templates/incident.md` — Incident report template

### Tier 6 — Hook entrypoints (implement + test)

- [ ] 26. Implement `hooks/session-init.cjs` — load context + checkpoint khi mở session
- [ ] 27. Implement `hooks/dev-rules-reminder.cjs` — inject `development-rules.md` vào mỗi prompt
- [ ] 28. Implement `hooks/privacy-block.cjs` — wrap `privacy-checker.cjs`
- [ ] 29. Implement `hooks/protected-files-block.cjs` — chặn sửa migration, lockfile, infra
- [ ] 30. Implement `hooks/minimal-diff-enforcer.cjs` — nhắc chỉ sửa tối thiểu
- [ ] 31. Implement `hooks/post-edit-review.cjs` — tự review code vừa sửa
- [ ] 32. Implement `hooks/post-edit-simplify-reminder.cjs` — nhắc simplify sau edit
- [ ] 33. Implement `hooks/write-checkpoint.cjs` — cập nhật checkpoint sau mỗi edit
- [ ] 34. Implement `hooks/context-tracking.cjs` — wrap context % warning

## Files to change

### Tier 1

- `.claude/rules/development-rules.md` — fill từ CLAUDE.md conventions + thêm rule chi tiết
- `.claude/rules/security.md` — fill security checklist
- `.claude/context/domain-glossary.md` — fill business terms

### Tier 2

- `.claude/commands/fix.md` — fill prompt
- `.claude/commands/review.md` — fill prompt
- `.claude/commands/refactor.md` — fill prompt
- `.claude/commands/new-feature.md` — fill prompt
- `.claude/commands/checkpoint.md` — fill prompt
- `.claude/commands/resume.md` — fill prompt

### Tier 3

- `.claude/skills/*/skill.md` — 10 files

### Tier 4

- `.claude/memory/team-conventions.md`
- `.claude/memory/architecture-decisions.md`
- `.claude/memory/known-issues.md`
- `.claude/memory/checkpoints/current.md`
- `.claude/memory/checkpoints/handoff.md`

### Tier 5

- `.claude/templates/adr.md`
- `.claude/templates/pr-review.md`
- `.claude/templates/incident.md`

### Tier 6

- `.claude/hooks/session-init.cjs`
- `.claude/hooks/dev-rules-reminder.cjs`
- `.claude/hooks/privacy-block.cjs`
- `.claude/hooks/protected-files-block.cjs`
- `.claude/hooks/minimal-diff-enforcer.cjs`
- `.claude/hooks/post-edit-review.cjs`
- `.claude/hooks/post-edit-simplify-reminder.cjs`
- `.claude/hooks/write-checkpoint.cjs`
- `.claude/hooks/context-tracking.cjs`

## Out of scope

- Không thay đổi hook infrastructure (`lib/`, `scout-block/`) — đã có implementation
- Không thay đổi `settings.json`, `adf-config.json`, `statusline.cjs`
- Không thêm file mới ngoài danh sách trên
- Không implement `usage-context-awareness.cjs` — đã được fill bởi user

## Risks

- Tier 1 files được inject mỗi session → nếu quá dài sẽ tốn token. Giữ `development-rules.md` < 80 dòng, `security.md` < 50 dòng.
- Tier 6 hooks chạy tự động → cần test kỹ trước khi enable, tránh false-positive block workflow.
- `domain-glossary.md` phụ thuộc vào business domain thực tế — cần input từ team.
