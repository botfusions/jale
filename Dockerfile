# --- Multi-Stage Build for Agent Claw Holding ---

# Stage 1: Builder
FROM node:20-slim AS builder

# Install pnpm and essentials
RUN npm install -g pnpm

WORKDIR /app

# 1. Build yargi-cli (Hukuk Birimi)
COPY yargi-cli/package*.json ./yargi-cli/
RUN cd yargi-cli && npm install
COPY yargi-cli/ ./yargi-cli/
RUN cd yargi-cli && npm run build

# 2. Build summarize (Kazıyıcı Birimi)
COPY summarize/package.json summarize/pnpm-lock.yaml summarize/pnpm-workspace.yaml ./summarize/
RUN cd summarize && pnpm install --frozen-lockfile
COPY summarize/ ./summarize/
RUN cd summarize && pnpm run build

# 3. Build Main App (JALE/CEO)
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

# Install production essentials
RUN npm install -g pnpm pm2

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy built CLI tools
COPY --from=builder /app/yargi-cli/bin ./yargi-cli/bin
COPY --from=builder /app/yargi-cli/node_modules ./yargi-cli/node_modules
COPY --from=builder /app/summarize ./summarize

# Create necessary directories
RUN mkdir -p summaries memory research downloads

# Environment and Port
ENV NODE_ENV=production
EXPOSE 3000

# Start with PM2 for process management (CEO protection)
CMD ["pm2-runtime", "dist/index.js"]
