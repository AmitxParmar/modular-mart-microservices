# ─────────────────────────────────────────────────
# Stage 1: Builder
# ─────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy only manifests first — maximises Docker layer cache.
# Source code changes won't bust the dependency install layer.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api-gateway/package.json ./apps/api-gateway/

# Install all deps (including devDeps needed for tsc)
RUN pnpm install --frozen-lockfile --filter api-gateway...

# Now copy source and build
COPY apps/api-gateway/ ./apps/api-gateway/
RUN pnpm --filter api-gateway run build

# ─────────────────────────────────────────────────
# Stage 2: Production
# ─────────────────────────────────────────────────
FROM node:22-alpine AS production

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Only manifests for prod dependency install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api-gateway/package.json ./apps/api-gateway/

# Install ONLY production dependencies — keeps the image lean
RUN pnpm install --frozen-lockfile --filter api-gateway... --prod

# Copy compiled output from builder stage
COPY --from=builder /app/apps/api-gateway/dist ./apps/api-gateway/dist

# ── Security: non-root user ────────────────────────────────────────────────
# node:alpine ships with a built-in unprivileged 'node' user (uid=1000).
# Running as root in a container is a significant security risk.
RUN chown -R node:node /app
USER node

WORKDIR /app/apps/api-gateway

# Document the port (does not publish it — use docker run -p or K8s service)
EXPOSE 3000

# Health-check for Docker Swarm / docker-compose.
# K8s uses its own probe config in the manifest so this is mainly for Swarm.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health/live || exit 1

# Use node directly — NOT pnpm/npm — so SIGTERM is delivered to the Node.js
# process (not swallowed by a shell or package manager wrapper).
CMD ["node", "dist/main.js"]
