# ============================================================
# Build stage
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for better cache
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build frontend (Vite outputs to dist/)
RUN npm run build

# ============================================================
# Production stage
# ============================================================
FROM node:22-alpine

WORKDIR /app

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server code (root-level entry point + server/ directory)
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/server ./server
COPY --from=builder /app/server_telemedicine_endpoints.js ./
COPY --from=builder /app/server_brain_analysis_endpoints.js ./
COPY --from=builder /app/server_moltbook_endpoints.js ./

# Copy shared source (services, contexts, components for SSR)
COPY --from=builder /app/src ./src

# Copy data assets
COPY --from=builder /app/medical_agents_registry.json ./
COPY --from=builder /app/rag_knowledge_base.md ./
COPY --from=builder /app/database_schema.sql ./

# Copy config files (needed by tsx runtime)
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/vite.config.ts ./
COPY --from=builder /app/tsconfig.json ./

# Install production dependencies (including tsx for TS runtime)
RUN npm ci --omit=dev && npm install tsx

# Environment defaults (override via docker-compose or -e)
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check: verify the server is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["npx", "tsx", "server.ts"]