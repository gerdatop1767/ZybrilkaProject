# syntax=docker/dockerfile:1
#
# Production image for @zybrilka/api (Fastify). Multi-stage: a Node/pnpm
# builder compiles @zybrilka/shared -> @zybrilka/db -> @zybrilka/api (in
# that dependency order) and then runs `pnpm deploy` to produce a
# self-contained, production-only package directory — workspace:
# dependencies resolved to real copied files, dev dependencies and pnpm
# itself left behind — so the runtime stage just runs plain Node.
#
# Build context is the repo root (this is a pnpm workspace):
#
#   docker build -f apps/api/Dockerfile -t zybrilka-api .
#
# --platform=linux/amd64 matches apps/web/Dockerfile's own reasoning:
# pins the build target regardless of the host architecture running
# `docker build`, so a non-amd64 build host can't resolve the wrong
# native optional dependency for the (linux/amd64) production VPS.

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

# --- build: only the packages @zybrilka/api actually depends on ---
FROM deps AS build
COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/api apps/api
RUN pnpm --filter @zybrilka/api... build
RUN pnpm --filter @zybrilka/api deploy --prod /prod/api

# --- runtime: the deployed bundle only, no pnpm/workspace/dev deps ---
FROM --platform=linux/amd64 node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /prod/api ./
ENV NODE_ENV=production

# HOST/PORT/DATABASE_URL/etc. come from the environment (see
# infra/docker-compose.yml) — nothing is hardcoded here so the same
# image works in any environment that sets them.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider "http://127.0.0.1:${PORT:-3000}/health" || exit 1

CMD ["node", "dist/server.js"]
