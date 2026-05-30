# ─────────────────────────────────────────────────
# Stage 1: Prune
# ─────────────────────────────────────────────────
FROM node:22-alpine AS pruner
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=catalog-service --docker

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

# Install dependencies
RUN pnpm install

# Copy source code and build
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=catalog-service...

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

# Install ONLY production dependencies
RUN pnpm install --prod


# Copy compiled output from builder with chown
COPY --chown=node:node --from=builder /app/apps/catalog-service/dist ./apps/catalog-service/dist

COPY --chown=node:node --from=builder /app/packages/ ./packages/


# Security: use non-root user
USER node

WORKDIR /app/apps/catalog-service
EXPOSE 3000

CMD ["node", "dist/src/main.js"]
