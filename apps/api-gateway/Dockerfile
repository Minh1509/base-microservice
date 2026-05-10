# syntax=docker/dockerfile:1.7
#
# Build context = repo root. Multi-stage: deps → build → runtime.
#
# NOTE: COPY cả 3 apps/*/package.json là BẮT BUỘC — `pnpm install
# --frozen-lockfile` verify lockfile toàn workspace. Bỏ bớt sẽ fail
# "lockfile is not up to date".

FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api-gateway/package.json apps/api-gateway/
COPY apps/auth-service/package.json apps/auth-service/
COPY apps/user-service/package.json apps/user-service/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm exec nest build api-gateway

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && addgroup -S app && adduser -S app -G app
COPY --from=build /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=build /app/apps/api-gateway/package.json apps/api-gateway/
COPY --from=build /app/apps/auth-service/package.json apps/auth-service/
COPY --from=build /app/apps/user-service/package.json apps/user-service/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist/apps/api-gateway ./dist/apps/api-gateway
USER app
EXPOSE 3000
CMD ["node", "dist/apps/api-gateway/main"]
