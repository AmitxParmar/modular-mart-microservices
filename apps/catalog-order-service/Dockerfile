# ─────────────────────────────────────────────────
# Stage 1: Prune
# ─────────────────────────────────────────────────
FROM node:22-alpine AS pruner
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=catalog-order-service --docker

# ─────────────────────────────────────────────────
# Stage 2: Builder
# ─────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy pruned workspace json and lockfile
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies utilizing BuildKit cache mount
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# Copy source code and build
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=catalog-order-service

# ─────────────────────────────────────────────────
# Stage 3: Production
# ─────────────────────────────────────────────────
FROM node:22-alpine AS production
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy manifests with chown to avoid RUN chown layer duplication
COPY --chown=node:node --from=pruner /app/out/json/ .
COPY --chown=node:node --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install ONLY production dependencies utilizing BuildKit cache mount
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --prod

# Copy compiled output from builder with chown
COPY --chown=node:node --from=builder /app/apps/catalog-order-service/dist ./apps/catalog-order-service/dist

# Security: use non-root user
USER node

WORKDIR /app/apps/catalog-order-service
EXPOSE 3000

CMD ["node", "dist/src/main.js"]
