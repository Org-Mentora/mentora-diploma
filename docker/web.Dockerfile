# syntax=docker/dockerfile:1.7
# Mentora web image (ADR-0014): static Vite build served by nginx, which also proxies /api.
#   docker build -f docker/web.Dockerfile -t mentora-web .

FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY packages/tsconfig/package.json packages/tsconfig/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@mentora/web..."

# --- dev: Vite dev server, used by docker-compose.dev.yml ---
FROM deps AS dev
COPY packages packages
COPY apps/web apps/web
WORKDIR /repo/apps/web
CMD ["pnpm", "exec", "vite", "--host", "0.0.0.0"]

FROM deps AS build
COPY packages packages
COPY apps/web apps/web
RUN pnpm --filter @mentora/web build

# --- runtime: static files on unprivileged nginx (port 8080, non-root) ---
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime
ARG VERSION=dev
ARG REVISION=unknown
LABEL org.opencontainers.image.title="mentora-web"       org.opencontainers.image.description="Mentora web (React SPA served by nginx)"       org.opencontainers.image.source="https://github.com/Org-Mentora/mentora-diploma"       org.opencontainers.image.version=$VERSION       org.opencontainers.image.revision=$REVISION
ENV API_UPSTREAM=http://api:3000
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=5   CMD wget -qO- http://127.0.0.1:8080/healthz > /dev/null || exit 1
