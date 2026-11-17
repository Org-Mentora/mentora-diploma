# syntax=docker/dockerfile:1.7
# Mentora API image (ADR-0014). Build from the repository root:
#   docker build -f docker/api.Dockerfile -t mentora-api .

FROM node:26-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo

# --- dependencies: only manifests, so this layer is cached until a package.json changes ---
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY packages/tsconfig/package.json packages/tsconfig/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@mentora/api..."

# --- dev: used by docker-compose.dev.yml with `docker compose watch` ---
FROM deps AS dev
COPY packages/tsconfig packages/tsconfig
COPY apps/api apps/api
WORKDIR /repo/apps/api
CMD ["pnpm", "exec", "tsx", "watch", "src/main.ts"]

# --- build: bundle with tsup and extract a production-only node_modules ---
FROM deps AS build
COPY packages/tsconfig packages/tsconfig
COPY apps/api apps/api
RUN pnpm --filter @mentora/api build \
 && pnpm --filter @mentora/api deploy --prod --legacy /out

# --- runtime: production-only dependencies, non-root, no build tools ---
FROM node:26-alpine AS runtime
ARG VERSION=dev
ARG REVISION=unknown
LABEL org.opencontainers.image.title="mentora-api"       org.opencontainers.image.description="Mentora API (Express 5, MVP)"       org.opencontainers.image.source="https://github.com/Org-Mentora/mentora-diploma"       org.opencontainers.image.version=$VERSION       org.opencontainers.image.revision=$REVISION
ENV NODE_ENV=production     APP_VERSION=$VERSION
WORKDIR /app
COPY --from=build --chown=node:node /out/package.json ./package.json
COPY --from=build --chown=node:node /out/node_modules ./node_modules
COPY --from=build --chown=node:node /repo/apps/api/dist ./dist
USER node
EXPOSE 3000
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5   CMD wget -qO- http://127.0.0.1:3000/api/health/live > /dev/null || exit 1
CMD ["node", "--enable-source-maps", "dist/main.js"]
