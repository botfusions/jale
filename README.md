# 🦀 Agent Claw — Telegram AI Assistant

> Kişisel AI asistanınız. Metin, sesli mesaj, hafıza ve takvim entegrasyonu ile.

---

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Mimari](#-mimari)
- [Kurulum](#-kurulum)
- [Çalıştırma](#-çalıştırma)
- [Komutlar](#-komutlar)
- [Sesli Mesaj](#-sesli-mesaj)
- [Sesli Yanıt (TTS)](#-sesli-yanıt-tts)
- [Hafıza Sistemi](#-hafıza-sistemi)
- [Günlük Heartbeat](#-günlük-heartbeat)
- [MCP Entegrasyonları](#-mcp-entegrasyonları)
- [Test](#-test)
- [Deployment](#-deployment)
- [Sorun Giderme](#-sorun-giderme)
- [Gizlilik & Güvenlik](#-gizlilik--güvenlik)

---

## 🌟 Özellikler

| Özellik               | Durum    | Açıklama                                            |
| --------------------- | -------- | --------------------------------------------------- |
| 💬 Metin Sohbet       | ✅ Aktif | OpenRouter üzerinden LLM ile sohbet                 |
| 🎤 Sesli Mesaj        | ✅ Aktif | Ses → metin çevirisi + yanıt                        |
| 🔊 Sesli Yanıt (TTS)  | ✅ Aktif | "reply with voice" ile sesli cevap                  |
| 🧠 Uzun Süreli Hafıza | ✅ Aktif | Qdrant vektör DB ile hatırlama/çağırma              |
| 💾 Sohbet Geçmişi     | ✅ Aktif | JSON persist — restart sonrası devam eder           |
| 🔄 Retry Mekanizması  | ✅ Aktif | Exponential backoff, 429/5xx korumalı               |
| 💓 Günlük Heartbeat   | ✅ Aktif | Her gün 08:00'de check-in mesajı                    |
| 📅 Takvim Özeti       | ✅ Aktif | Google Calendar salt okunur entegrasyon             |
| 📧 E-posta Özeti      | ✅ Aktif | Gmail okunmamış maillar + sesli okuma               |
| 🔐 Güvenlik           | ✅ Aktif | Allowlist, secret masking, log redaksiyon           |
| 🚀 Deployment         | ✅ Hazır | Docker + docker-compose + Railway config            |
| 🌐 Web Arama          | ✅ Aktif | İnternetten bilgi arama ve özetleme                 |
| ⛅ Hava Durumu        | ✅ Aktif | Güncel hava durumu bilgisi (Open-Meteo)             |
| 🌍 Çeviri             | ✅ Aktif | Metinleri anında ilgili dile çevirme                |
| 📰 Günlük Brifing     | ✅ Aktif | 🆕 Sabah raporu (KAYA, Hava durumu)                 |
| 📈 Borsacı Agent      | ✅ Aktif | 🆕 KAYA (Finans, Borsa, Kripto Analizi)             |
| 💻 Yazılım Uzmanı     | ✅ Aktif | 🆕 RECEP (Terminal Erişimi, Kurulum, CLI, Kod)      |
| ⚖️ Hukuk Uzmanı       | ✅ Aktif | 🆕 AVUKAT KEMAL (Yargı Mevzuat, Karar Arama)        |
| 🤝 Multi-Agent Swarm  | ✅ Aktif | JALE (Ekosistem Sahibi) liderliğinde otonom yönetim |
| 📞 AI Resepsiyon      | ✅ Aktif | 🆕 AYÇA (Vapi Sesli Telefon Asistanı)               |
| 🛠️ Tool Calling       | ✅ Aktif | LLM'in otonom yetenek (skill) çağırması             |

---

## 🏗️ Mimari

```
agent-claw/
├── src/
│   ├── index.ts                 # Ana giriş noktası (modüler)
│   ├── agents/                  # 🆕 Ajan (Swarm) Modülleri
│   │   ├── ceo-agent.ts         # JALE (CEO) - Fiziksel Ekosistem ve Strateji
│   │   ├── receptionist-agent.ts# AYÇA (Resepsiyon) - Vapi Telefon Karşılama
│   │   ├── coo-agent.ts         # OSMAN (COO) - İş Akışı Planlama
│   │   └── borsaci-agent.ts     # 🆕 KAYA (Borsacı) - Finansal Analiz
│   ├── commands/                # 🆕 Komut modüleri
│   │   ├── index.ts             # Command router
│   │   ├── calendar.commands.ts # /today, /calendar, /week, /todayoku
│   │   ├── mail.commands.ts     # /mail, /mailoku
│   │   ├── voice.commands.ts    # /voice <metin>
│   │   ├── tool.commands.ts     # /ozet, /doctor, /heartbeat_test
│   │   └── skill.commands.ts    # /skills, /skill
│   ├── config/
│   │   ├── env.ts               # Zod ile env doğrulama (Qdrant, MAX_TOKENS...)
│   │   └── constants.ts         # Sabitler ve mesajlar
│   ├── telegram/
│   │   └── bot.ts               # Bot oluşturma + allowlist middleware
│   ├── handlers/
│   │   └── message.handler.ts   # Metin & sesli mesaj handler (retry)
│   ├── llm/
│   │   └── openrouter.ts        # OpenRouter LLM + embedding istemcisi
│   ├── transcription/
│   │   └── transcriber.ts       # Ses tanıma (Whisper)
│   ├── tts/
│   │   └── tts.service.ts       # Metin → ses dönüşümü
│   ├── memory/
│   │   ├── core.memory.ts       # soul.md ve core_memory.md okuyucu
│   │   ├── conversation-store.ts # 🆕 Persistent sohbet geçmişi
│   │   └── vector.service.ts    # Qdrant vektör DB servisi
│   ├── scheduler/
│   │   └── heartbeat.ts         # Günlük cron scheduler
│   ├── skills/
│   │   ├── skill-manager.ts     # Skill yöneticisi
│   │   └── index.ts             # Skill kaydedici
│   ├── mcp/
│   │   ├── calendar.ts          # Google Calendar entegrasyonu
│   │   └── gmail.ts             # Gmail entegrasyonu
│   ├── doctor/
│   │   └── doctor.ts            # Self-healing diagnostik
│   └── utils/
│       ├── logger.ts            # Güvenli loglama (secret redaksiyon)
│       └── retry.ts             # 🆕 Retry + exponential backoff
├── memory/
│   ├── soul.md                  # Bot kişilik rehberi
│   ├── core_memory.md           # Kullanıcı tercihleri (düzenlenebilir)
│   ├── memory_log.md            # Hafıza günlüğü (salt ekleme)
│   └── conversations.json       # 🆕 Persistent sohbet geçmişi
├── tests/
│   └── self-test.ts             # Otomatik self-test script
├── docs/
│   ├── GELISTIRME.md            # Geliştirme yol haritası
│   ├── MCP_INTEGRATION.md       # MCP entegrasyon rehberi
│   └── DEPLOYMENT.md            # Deployment rehberi
├── .env.example                 # Env şablonu
├── eslint.config.mjs            # ESLint v9 flat config
├── package.json
├── tsconfig.json
├── Dockerfile                   # Multi-stage production build
├── docker-compose.yml           # Bot + n8n + Redis
└── Procfile
```

---

## 🔧 Kurulum

### Ön Koşullar

- **Node.js 20+** (LTS) — [nodejs.org](https://nodejs.org/)
- **Telegram Bot Token** — [@BotFather](https://t.me/BotFather) üzerinden alın
- **OpenRouter API Key** — [openrouter.ai](https://openrouter.ai/) üzerinden alın
- **Telegram User ID** — [@userinfobot](https://t.me/userinfobot) ile öğrenin

### Adımlar

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Environment dosyasını oluştur
cp .env.example .env

# 3. .env dosyasını düzenle — gerçek key'leri gir
# TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNO...
# MODEL_API_KEY=sk-or-v1-...
# TELEGRAM_ALLOWLIST_USER_ID=123456789
```

### Telegram Bot Token Alma

1. Telegram'da [@BotFather](https://t.me/BotFather)'a gidin
2. `/newbot` komutu gönderin
3. Bot adını ve kullanıcı adını seçin
4. Token'ı kopyalayın → `.env` dosyasına yapıştırın

### OpenRouter API Key Alma

1. [openrouter.ai](https://openrouter.ai/) → Hesap oluşturun
2. Settings → API Keys → "Create Key"
3. Key'i kopyalayın → `.env` dosyasına yapıştırın
4. İstediğiniz modeli `MODEL_NAME` olarak ayarlayın

**Popüler Modeller:**
| Model | MODEL_NAME |
|-------|-----------|
| Claude 4 Sonnet | `anthropic/claude-sonnet-4` |
| GPT-4o | `openai/gpt-4o` |
| Gemini 2.5 Pro | `google/gemini-2.5-pro-preview` |
| Llama 3.3 70B | `meta-llama/llama-3.3-70b-instruct` |

---

## 🚀 Çalıştırma

```bash
# Geliştirme modu (hot reload)
npm run dev

# Production modu
npm start
```

### Başarılı Başlatma Çıktısı

```
╔══════════════════════════════════════════╗
║  🦀  Agent Claw v1.0.0                  ║
║  Telegram AI Assistant                   ║
╚══════════════════════════════════════════╝

🤖 Model: anthropic/claude-sonnet-4
🔑 API Key: sk-o****abcd
📱 Telegram Token: 1234****5678
👤 Allowed Users: 123456789
🎤 Voice Transcription: Mock Mode
🔊 TTS: Mock Mode
🧠 Memory: Mock Mode
💓 Heartbeat: Enabled

🚀 Agent Claw başlatılıyor...
✅ Agent Claw aktif ve hazır!
📱 Telegram'da bot'a mesaj gönderebilirsiniz.
```

---

## 📱 Komutlar

| Komut               | Açıklama                                                   |
| ------------------- | ---------------------------------------------------------- |
| `/start`            | Hoş geldin mesajı                                          |
| `/help`             | Yardım menüsü                                              |
| `/status`           | Bot durum bilgisi (model, sıcaklık, token limiti)          |
| `/remember <metin>` | Hafızaya bilgi kaydet (Qdrant)                             |
| `/recall <sorgu>`   | Hafızadan bilgi çağır (semantic search)                    |
| `/today`            | Bugünkü takvim etkinlikleri                                |
| `/calendar`         | Yarınki takvim etkinlikleri                                |
| `/week`             | Haftalık takvim özeti                                      |
| `/todayoku`         | Takvimi sesli oku (TTS)                                    |
| `/mail`             | Okunmamış e-postalar                                       |
| `/mailoku`          | E-postaları sesli oku (TTS)                                |
| `/voice <metin>`    | Metni sesli söyle (TTS)                                    |
| `/ozet <url>`       | Web sayfasını özetle                                       |
| `/skills`           | Skill listesi                                              |
| `/skill <isim>`     | Skill aç/kapat                                             |
| `/doctor`           | Sistemi tarar ve onarır                                    |
| `/heartbeat_test`   | Günlük hatırlatma testi                                    |
| `/jale <mesaj>`     | Fiziksel ekosistemin yönetimi ve stratejik otonom istekler |
| `/osman <mesaj>`    | COO Osman'dan projelendirme ve iş planı isteği             |
| `/recep <mesaj>`    | RECEP'ten yazılım kurulumu, git ve terminal işlemleri      |
| `/yargi <sorgu>`    | AVUKAT KEMAL ile hukuki veritabanı sorgulaması             |
| `/research <sorgu>` | Araştırmacı ajanla derinlemesine LLM araştırması           |

---

## 🎯 Yetenekler (Skills)

Bot, doğrudan doğal dilinizi anlayarak çeşitli modülleri (yetenekleri) arka planda otomatik tetikler. Bu işlemler için `/` ile başlayan özel komutlar kullanmanıza gerek yoktur:

| Yetenek               | Örnek Tetikleyiciler              | Örnek Mesaj                                        |
| --------------------- | --------------------------------- | -------------------------------------------------- |
| **🔍 Web Arama**      | `ara`, `bul`, `nedir`, `search`   | _"Kuantum bilgisayarlar nedir internetten bul"_    |
| **⛅ Hava Durumu**    | `hava durumu`, `kaç derece`       | _"İstanbul'da hava durumu nasıl?"_                 |
| **🌍 Çeviri**         | `çevir`, `translate`, `ingilizce` | _"Güneşli kelimesini İngilizceye çevir"_           |
| **📰 Günlük Brifing** | `brifing`, `günün özeti`          | _"Bana sabah raporumu sunar mısın?"_               |
| **📈 Borsacı**        | `borsa`, `asels`, `bitcoin`       | _"ASELS hissesi için analiz yapar mısın?"_         |
| **💻 Yazılım**        | `kur`, `git clone`, `software`    | _"Sisteme XYZ kütüphanesini kur veya repoyu çek"_  |
| **⚖️ Hukuk**          | `hukuk`, `yargı`, `yargıtay`      | _"Mülkiyet hakkı ile ilgili yargıtay kararı bul"_  |
| **🧠 Araştırmacı**    | `araştır`, `analiz et`, `analiz`  | _"Yapay zeka trendlerini derinlemesine analiz et"_ |
| **💡 Reklamcı**       | `reklam`, `kampanya`, `pazarlama` | _"Yeni ürünümüz için yaratıcı bir kampanya yap"_   |

> **Not:** Yeteneklerin tam listesini görmek, açmak veya kapatmak için `/skills` kullanabilirsiniz.

---

## 🎤 Sesli Mesaj

Bot'a sesli mesaj gönderdiğinizde:

1. 📥 Ses dosyası indirilir
2. 🎤 Metin'e çevrilir (transkripsiyon)
3. 📝 Transkripsiyon size gönderilir
4. 🤖 Bot metne normal cevap verir

### Sorun Giderme

- Transkripsiyon başarısız olursa → dostça hata mesajı + tekrar deneme önerisi
- Mock modda gerçek transkripsiyon yapılmaz (test için `TRANSCRIPTION_MOCK_MODE=true`)
- Gerçek transkripsiyon için `TRANSCRIPTION_API_KEY` ve `TRANSCRIPTION_MOCK_MODE=false` ayarlayın

---

## 🔊 Sesli Yanıt (TTS)

**Nasıl kullanılır:** Mesajınızda "reply with voice" ifadesini ekleyin.

```
Hava durumu nasıl olacak? reply with voice
```

- Önce metin yanıt gönderilir
- Sonra aynı yanıtın sesli versiyonu gönderilir
- Ses dosyaları geçicidir ve otomatik silinir
- Mock modda gerçek ses üretilmez

---

## 🧠 Hafıza Sistemi

### Açık Kayıt

```
/remember Kahveyi sütlü ve şekersiz severim
```

### Çağırma

```
/recall kahve tercihi
```

### Otomatik Kayıt

Bot, "adım", "seviyorum", "tercihim" gibi ifadeleri otomatik kaydeder.

### Dosyalar

| Dosya                   | Açıklama        | Düzenlenebilir? |
| ----------------------- | --------------- | --------------- |
| `memory/soul.md`        | Bot kişiliği    | ✅ Evet         |
| `memory/core_memory.md` | Sabit tercihler | ✅ Evet         |
| `memory/memory_log.md`  | Hafıza günlüğü  | ❌ Salt ekleme  |

### Gizlilik

- Hafızada **asla** API key, şifre veya hassas veri saklanmaz
- `memory_log.md` yalnızca güvenli özetler içerir
- Vektör DB mock modda tüm veri bellekte kalır (disk'e yazılmaz)
- Qdrant modunda veriler `agent-claw-memory` collection'ında saklanır
- Sohbet geçmişi `memory/conversations.json` dosyasında persist edilir

---

## 💓 Günlük Heartbeat

Her gün saat **10:00**'da (configüre edilebilir) size dinamik bir rapor sunar:

- 📊 **Piyasa Özeti (KAYA):** Finansal piyasaların durumu ve öne çıkan haberler.
- ☁️ **Hava Durumu:** İstanbul için güncel sıcaklık ve hava durumu bilgisi.
- 📌 **Motivasyon:** Günlük check-in soruları.

### Kontrol

| Env Variable         | Varsayılan        | Açıklama     |
| -------------------- | ----------------- | ------------ |
| `HEARTBEAT_ENABLED`  | `true`            | Kill switch  |
| `HEARTBEAT_CRON`     | `0 8 * * *`       | Cron ifadesi |
| `HEARTBEAT_TIMEZONE` | `Europe/Istanbul` | Zaman dilimi |

### Manuel Test

```
/heartbeat_test
```

---

## 📞 AI Resepsiyon (Vapi)

Sistemde telefon aramalarını karşılayan **Ayça** isimli Vapi destekli bir resepsiyonist bot bulunmaktadır.

- **Görevi:** Gelen çağrıları Türkçe yanıtlamak, firma hizmetlerini açıklamak, randevu oluşturmak ve geri dönüş taleplerini kaydetmek.
- **Raporlama Yolu:** Ayça, çağrı bittiğinde veya önemli bir talep aldığında bunu doğrudan **Yönetici Asistanı Jale**'ye raporlar.
- **Entegrasyon:** `vapi_config.json`, `src/agents/receptionist-agent.ts` ve webhook endpoint'i üzerinden çalışır.

---

## 🔌 MCP Entegrasyonları

Detaylı rehber: [docs/MCP_INTEGRATION.md](docs/MCP_INTEGRATION.md)

### Google Calendar (Salt Okunur)

```
/calendar
```

veya:

```
Yarın takvimimde ne var?
```

- ❌ Etkinlik oluşturma/düzenleme/silme **YOK**
- ✅ Yalnızca başlık, saat, konum döner
- ✅ Maksimum 5 etkinlik

---

## 🧪 Test

### Self-Test (Tüm Modüller)

```bash
npm test
```

Bu script şunları doğrular:

- ✅ Env variable'lar yükleniyor
- ✅ Secret masking çalışıyor
- ✅ Soul prompt yükleniyor
- ✅ Hafıza kayıt/çağırma çalışıyor (mock)
- ✅ Transkripsiyon çalışıyor (mock)
- ✅ TTS ses dosyası oluşturuluyor (mock)

### Bot Canlılık Testi

Bot çalıştırıldıktan sonra Telegram'da:

1. `/start` → Hoş geldin mesajı geldi mi? ✅
2. `/status` → Durum bilgisi gösterildi mi? ✅
3. `Merhaba, nasılsın?` → AI yanıt geldi mi? ✅
4. `/remember Test bilgisi` → Kaydedildi mesajı geldi mi? ✅
5. `/recall Test` → Sonuç döndü mü? ✅

---

## 🚀 Deployment

Detaylı rehber: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

### 1. GitHub Hazırlığı

Projenizi GitHub'a yüklemek için şu adımları izleyin:

```bash
# Git reposu oluştur (eğer yoksa)
git init

# Dosyaları ekle (.gitignore sayesinde sadece gerekli olanlar gider)
git add .

# İlk commit'i yap
git commit -m "feat: initial commit for deployment"

# GitHub'da yeni bir repo oluşturun ve bağlayın
# git remote add origin https://github.com/kullanici/agent-claw.git
# git push -u origin main
```

### 2. VPS (Coolify) Kurulumu

Projenizi Coolify yüklü bir VPS'e kurmak için:

1. **Coolify Dashboard**'a girin.
2. **Sources** -> **GitHub App** bağlantısını yapın.
3. **Projects** -> **Create New Project** -> **Add Resource** -> **Public/Private Repository**.
4. GitHub reposunu seçin.
5. **Build Pack:** `Nixpacks` veya `Docker` seçin.
6. **Environment Variables:** `.env.example` dosyasındaki tüm değişkenleri Coolify'a ekleyin:
   - `NODE_ENV=production`
   - `HTTP_PORT=3000`
   - Diğer API keyler ve Telegram ID...
7. **Port:** `3000` olarak ayarlayın.
8. **Deploy!**

### 3. Vapi Bağlantısı

Botunuz canlıya geçtikten sonra Vapi Dashboard'da (vapi.ai):

1. **Assistants** -> İlgili asistanı seçin.
2. **Advanced** -> **Webhook URL** kısmına `https://domaininiz.com/webhook/vapi` adresini yazın.
3. VPS üzerinde `VAPI_PRIVATE_KEY` ve `VAPI_WEBHOOK_SECRET` değişkenlerinin ayarlı olduğundan emin olun.

---

## ❓ Sorun Giderme

| Sorun                            | Çözüm                                         |
| -------------------------------- | --------------------------------------------- |
| `TELEGRAM_BOT_TOKEN is required` | `.env` dosyasında token'ı kontrol edin        |
| `Unauthorized access`            | `TELEGRAM_ALLOWLIST_USER_ID` doğru mu?        |
| Bot yanıt vermiyor               | Token doğru mu? Bot başka yerde çalışıyor mu? |
| LLM hatası                       | OpenRouter key geçerli mi? Bakiye var mı?     |
| Transkripsiyon başarısız         | `TRANSCRIPTION_MOCK_MODE=true` ile test edin  |

---

## 🔐 Gizlilik & Güvenlik

- 🔒 Tüm API key'ler `.env` dosyasında (git'e dahil değil)
- 🔒 Log'larda secret'lar `***REDACTED***` olarak görünür
- 🔒 Yalnızca allowlist'teki kullanıcılar erişebilir
- 🔒 Geçici ses dosyaları otomatik silinir
- 🔒 Calendar verileri salt okunur
- 🔒 Hafıza günlüğünde hassas veri yok

---

## 📄 Lisans

ISC

---

_Built with ❤️ by Agent Claw Team_
