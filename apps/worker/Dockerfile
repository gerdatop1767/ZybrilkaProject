# syntax=docker/dockerfile:1
#
# Production image for @zybrilka/worker. Same shape as apps/api/Dockerfile
# (see its comments for the full rationale): compile in dependency order,
# `pnpm deploy` a self-contained production bundle, run it under plain
# Node in a minimal runtime image.
#
#   docker build -f apps/worker/Dockerfile -t zybrilka-worker .

FROM --platform=linux/amd64 node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /repo

# --- deps: install with the lockfile frozen, cached separately from source ---
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

# --- build: only the packages @zybrilka/worker actually depends on ---
FROM deps AS build
COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/worker apps/worker
RUN pnpm --filter @zybrilka/worker... build
RUN pnpm --filter @zybrilka/worker deploy --prod /prod/worker

# --- runtime: the deployed bundle only, no pnpm/workspace/dev deps ---
FROM --platform=linux/amd64 node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /prod/worker ./
ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
