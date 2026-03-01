# Agent Claw — VPS Deployment Guide (Contabo / Linux)

## Ön Koşullar

- Contabo VPS (Ubuntu 22.04+ önerilir)
- SSH erişimi
- Node.js 20+ (LTS)
- Git
- PM2 (process manager)

---

## Adım Adım VPS Kurulumu

### 1. Sunucuya Bağlanma

```bash
ssh root@YOUR_CONTABO_IP
```

### 2. Sistem Güncelleme

```bash
apt update && apt upgrade -y
```

### 3. Node.js 20 LTS Kurulumu

```bash
# NodeSource repo ekle
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Doğrulama
node -v   # v20.x.x
npm -v    # 10.x.x
```

### 4. PM2 Kurulumu (Process Manager)

```bash
npm install -g pm2
```

### 5. Proje Klasörü Oluşturma

```bash
mkdir -p /opt/agent-claw
cd /opt/agent-claw
```

### 6. Projeyi Kopyalama

**Seçenek A: Git ile (önerilen)**

```bash
git clone https://github.com/YOUR_USERNAME/agent-claw.git .
```

**Seçenek B: SCP ile (git kullanmıyorsanız)**

```bash
# Yerel bilgisayarınızda:
scp -r ./Open\ Claw/* root@YOUR_CONTABO_IP:/opt/agent-claw/
```

### 7. Bağımlılıkları Yükleme

```bash
cd /opt/agent-claw
npm install --production=false
```

### 8. Environment Dosyası Oluşturma

```bash
cp .env.example .env
nano .env
```

**Gerçek değerleri girin:**

```env
TELEGRAM_BOT_TOKEN=gerçek_token
TELEGRAM_ALLOWLIST_USER_ID=gerçek_user_id
MODEL_API_KEY=gerçek_openrouter_key
MODEL_NAME=anthropic/claude-sonnet-4
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Gerçek API'ler hazır olmadığında mock mode bırakın
TRANSCRIPTION_MOCK_MODE=true
TTS_MOCK_MODE=true
VECTOR_DB_MOCK_MODE=true

HEARTBEAT_ENABLED=true
HEARTBEAT_CRON=0 8 * * *
HEARTBEAT_TIMEZONE=Europe/Istanbul

NODE_ENV=production
LOG_LEVEL=info
TEMP_DIR=./tmp
```

### 9. Test Çalıştırma

```bash
npm test
```

Tüm testler geçmeli ✅

### 10. PM2 ile Başlatma

```bash
# İlk başlatma
pm2 start npm --name "agent-claw" -- start

# Başlangıçta otomatik başlat
pm2 startup
pm2 save

# Durumu kontrol et
pm2 status
pm2 logs agent-claw
```

---

## PM2 Komutları

| Komut                             | Açıklama                 |
| --------------------------------- | ------------------------ |
| `pm2 status`                      | Tüm process'lerin durumu |
| `pm2 logs agent-claw`             | Canlı logları izle       |
| `pm2 logs agent-claw --lines 100` | Son 100 log satırı       |
| `pm2 restart agent-claw`          | Yeniden başlat           |
| `pm2 stop agent-claw`             | Durdur                   |
| `pm2 delete agent-claw`           | Tamamen kaldır           |
| `pm2 monit`                       | Kaynak kullanımı monitör |

---

## PM2 Ecosystem Dosyası (Opsiyonel)

Daha gelişmiş kontrol için `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'agent-claw',
      script: 'npx',
      args: 'tsx src/index.ts',
      cwd: '/opt/agent-claw',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/opt/agent-claw/logs/error.log',
      out_file: '/opt/agent-claw/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
```

Kullanım:

```bash
pm2 start ecosystem.config.js
```

---

## Güncelleme Prosedürü

```bash
cd /opt/agent-claw

# 1. Yeni kodu çek
git pull origin main

# 2. Bağımlılıkları güncelle
npm install

# 3. Testi çalıştır
npm test

# 4. Yeniden başlat
pm2 restart agent-claw

# 5. Logları kontrol et
pm2 logs agent-claw --lines 20
```

---

## Rollback Planı

### Sorun Tespit Edildiğinde:

```bash
# 1. Bot'u durdur
pm2 stop agent-claw

# 2. Önceki versiyona dön
git log --oneline -5          # Son 5 commit
git checkout <önceki_commit>  # Veya: git revert HEAD

# 3. Bağımlılıkları yeniden yükle
npm install

# 4. Yeniden başlat
pm2 start agent-claw

# 5. Logları kontrol et
pm2 logs agent-claw --lines 20
```

---

## Güvenlik Hardening

### Firewall (UFW)

```bash
# Sadece SSH ve gerekli portları aç
ufw allow OpenSSH
ufw enable
ufw status
```

> Not: Telegram bot HTTP server değildir, dışarıya port açmaya gerek yok.
> Bot, Telegram API'ye dışarıya çıkan bağlantı yapar (polling).

### Dedicated Kullanıcı (Opsiyonel)

```bash
# Root yerine ayrı kullanıcı oluşturun
adduser agentclaw
usermod -aG sudo agentclaw

# Dosyaları taşıyın
chown -R agentclaw:agentclaw /opt/agent-claw
```

### .env Dosyası İzinleri

```bash
chmod 600 /opt/agent-claw/.env
```

---

## Health Check

### Manuel Kontrol

1. Telegram'da bot'a `/status` gönderin
2. `pm2 status` ile process durumunu kontrol edin
3. `pm2 logs agent-claw --lines 5` ile son logları kontrol edin

### Otomatik Restart

PM2 zaten crash durumunda otomatik restart yapar.
`max_memory_restart: '500M'` ile bellek sınırı aşılırsa da restart eder.

---

## Minimum VPS Gereksinimleri

| Kaynak | Minimum       | Önerilen         |
| ------ | ------------- | ---------------- |
| RAM    | 512 MB        | 1 GB             |
| CPU    | 1 vCPU        | 2 vCPU           |
| Disk   | 5 GB          | 10 GB            |
| OS     | Ubuntu 20.04+ | Ubuntu 22.04 LTS |

---

## Log Hijyeni

- Log'larda **asla** API key, token veya şifre görünmez
- PM2 logları `/opt/agent-claw/logs/` altında tutulur
- Log rotasyon için: `pm2 install pm2-logrotate`

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```
