FROM node:24-alpine

RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared-types/package.json ./packages/shared-types/

RUN pnpm install --frozen-lockfile --filter @repo/web

COPY apps/web ./apps/web
COPY packages/shared-types ./packages/shared-types

EXPOSE 4200

CMD ["pnpm", "--filter", "@repo/web", "dev", "--host", "0.0.0.0"]
