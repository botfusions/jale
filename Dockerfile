# --- Agent Claw Optimized Docker Build ---

# Stage 1: Builder
FROM node:22 AS builder

WORKDIR /app

# Sadece ana paket dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle (Legacy peer deps ve verbose log ile)
RUN npm install --legacy-peer-deps

# Projenin geri kalanını kopyala (yargi-cli ve summarize .dockerignore ile hariç tutuldu)
COPY . .

# Uygulamayı derle
RUN npm run build

# Stage 2: Production
FROM node:22-slim

WORKDIR /app

# PM2 kurulumu
RUN npm install -g pm2

# Builder stage'den sadece derlenmiş dosyaları ve modülleri al
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Gerekli klasörleri oluştur
RUN mkdir -p summaries memory research downloads

# Ortam değişkenleri ve Port
ENV NODE_ENV=production
EXPOSE 3000

# PM2 ile başlat
CMD ["pm2-runtime", "dist/index.js"]
