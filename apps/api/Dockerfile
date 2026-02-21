FROM node:24-alpine

RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/

RUN pnpm install --frozen-lockfile --filter @repo/api

COPY apps/api ./apps/api
COPY packages/shared-types ./packages/shared-types

EXPOSE 3001

CMD ["pnpm", "--filter", "@repo/api", "dev"]
