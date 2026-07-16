# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build frontend
RUN npm run build

# Production stage  
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/src ./src
COPY --from=builder /app/medical_agents_registry.json ./
COPY --from=builder /app/rag_knowledge_base.md ./
COPY --from=builder /app/database_schema.sql ./
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/vite.config.ts ./
COPY --from=builder /app/tsconfig.json ./

# Install ALL deps (including tsx for running server.ts)
RUN npm ci

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]