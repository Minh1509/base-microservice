/**
 * PM2 dev ecosystem — chạy 3 Nest app (watch mode) trong 1 session.
 * Kèm `pnpm docker:dev` để có đủ infra. Xem `make dev` để làm cả hai.
 *
 * Không autorestart: Nest CLI --watch đã tự reload, PM2 chỉ dùng để
 * ghép log/tiện dừng chung.
 */
module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: 'pnpm',
      args: 'dev:gateway',
      autorestart: false,
      watch: false,
      cwd: __dirname,
    },
    {
      name: 'auth-service',
      script: 'pnpm',
      args: 'dev:auth',
      autorestart: false,
      watch: false,
      cwd: __dirname,
    },
    {
      name: 'user-service',
      script: 'pnpm',
      args: 'dev:user',
      autorestart: false,
      watch: false,
      cwd: __dirname,
    },
  ],
};
