# --- Agent Claw Optimized Docker Build ---

# Stage 1: Builder
FROM node:22 AS builder

WORKDIR /app

# pnpm kurulumu
RUN npm install -g pnpm

# Ana paket dosyalarını kopyala ve yükle
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Tüm projeyi kopyala (artık .dockerignore summarize'a izin veriyor)
COPY . .

# Summarize bileşenini derle
RUN cd summarize && pnpm install && pnpm build

# Ana uygulamayı derle
RUN npm run build

# Stage 2: Production
FROM node:22-slim

WORKDIR /app

# Gerekli sistem paketleri (isteğe bağlı ama önerilir)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# PM2, pnpm, Claude Code ve OpenCode kurulumu
RUN npm install -g pm2 pnpm @anthropic-ai/claude-code opencode-ai@latest

# Builder stage'den sadece derlenmiş dosyaları ve modülleri al (izinlerle birlikte)
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/summarize ./summarize

# Gerekli klasörleri oluştur ve izinleri ayarla
RUN mkdir -p summaries memory research downloads && \
    chown -R node:node summaries memory research downloads

# Ortam değişkenleri ve Port
ENV NODE_ENV=production
EXPOSE 3000

# Kullanıcıyı değiştir (Claude Code root olarak çalışmayı reddeder)
USER node

# PM2 ile başlat
CMD ["pm2-runtime", "dist/index.js"]
