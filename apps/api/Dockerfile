FROM node:24-alpine

RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --filter @repo/api

COPY apps/api ./apps/api

EXPOSE 3001

CMD ["pnpm", "--filter", "@repo/api", "dev"]
