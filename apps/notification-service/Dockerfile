# ─────────────────────────────────────────────────
# Stage 1: Prune (Prepare specialized workspace subset)
# ─────────────────────────────────────────────────
FROM node:22-alpine AS pruner
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
RUN npm install -g turbo
COPY . .
# Use turbo to prune the monorepo to only what notification-service needs
RUN turbo prune --scope=notification-service --docker

# ─────────────────────────────────────────────────
# Stage 2: Builder (Install all deps and compile TS)
# ─────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy pruned workspace manifests
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install ALL dependencies (including devDependencies for build)
RUN pnpm install

# Copy actual source code from pruned workspace
COPY --from=pruner /app/out/full/ .

# Build the specific service
RUN pnpm turbo run build --filter=notification-service...

# ─────────────────────────────────────────────────
# Stage 3: Production (Lean runtime image)
# ─────────────────────────────────────────────────
FROM node:22-alpine AS production
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy manifests for production install
COPY --chown=node:node --from=pruner /app/out/json/ .
COPY --chown=node:node --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install ONLY production dependencies (reduces image size)
RUN pnpm install --prod

# Copy compiled JS files from builder stage
COPY --chown=node:node --from=builder /app/apps/notification-service/dist ./apps/notification-service/dist

# Copy shared packages (required for runtime logic in common/auth/contracts)
COPY --chown=node:node --from=builder /app/packages/ ./packages/

# Security: Switch to non-root 'node' user
USER node

# Set working directory to the service folder
WORKDIR /app/apps/notification-service
EXPOSE 3005

# Start the service using the compiled main entry point
CMD ["node", "dist/src/main.js"]
