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

# PM2, pnpm ve Claude Code kurulumu
RUN npm install -g pm2 pnpm @anthropic-ai/claude-code

# Builder stage'den sadece derlenmiş dosyaları ve modülleri al
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Summarize bileşenini builder'dan al (Eğer built version lazımsa)
COPY --from=builder /app/summarize ./summarize

# Gerekli klasörleri oluştur
RUN mkdir -p summaries memory research downloads

# Ortam değişkenleri ve Port
ENV NODE_ENV=production
EXPOSE 3000

# PM2 ile başlat
CMD ["pm2-runtime", "dist/index.js"]
