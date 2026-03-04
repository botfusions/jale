# Vapi Voice AI Entegrasyonu

Open Claw projesine Vapi telefon sesli asistanı entegrasyonu.

---

## Mimari

```
┌─────────────┐      ┌─────────────┐      ┌─────────────────┐
│   Telefon   │ ──→  │    Vapi     │ ──→  │  Open Claw      │
│   Araması   │      │  (Sesli AI) │      │  Webhook :3000  │
└─────────────┘      └─────────────┘      └────────┬────────┘
                                                   │
                     ┌─────────────────────────────┘
                     ▼
            ┌────────────────────┐
            │  Resepsiyon Agent  │
            │  - randevu_olustur │
            │  - musteri_kaydet  │
            │  - bilgi_ver       │
            │  - geri_donum_sozu │
            └────────┬───────────┘
                     │
                     ▼
            ┌────────────────────┐
            │  Vector DB (Qdrant)│
            │  Müşteri kayıtları │
            └────────────────────┘
```

---

## Oluşturulan Dosyalar

| Dosya                              | Açıklama                       |
| ---------------------------------- | ------------------------------ |
| `src/webhook/vapi-webhook.ts`      | Vapi webhook handler           |
| `src/webhook/index.ts`             | Webhook module export          |
| `src/agents/receptionist-agent.ts` | Resepsiyon ajanı               |
| `src/index.ts`                     | Express server + webhook route |

---

## Environment Variables

`.env` dosyasına eklenmeli:

```env
# --- HTTP Server ---
HTTP_PORT=3000

# --- Vapi Voice AI ---
VAPI_PRIVATE_KEY=your_vapi_private_key_here
VAPI_WEBHOOK_SECRET=your_webhook_secret_here
```

---

## Vapi Dashboard Konfigürasyonu

### 1. Assistant Bilgileri

| Alan      | Değer                           |
| --------- | ------------------------------- |
| **Name**  | Open Claw Resepsiyon            |
| **Model** | gpt-4o veya claude-sonnet-4     |
| **Voice** | ElevenLabs (Türkçe destekleyen) |

### 2. System Message

```
Sen "Open Claw" şirketinin profesyonel resepsiyon asistanısın.

## GÖREVLERİN:
1. İş ve hizmetler hakkında bilgi ver
2. Randevu oluştur (randevu_olustur fonksiyonunu kullan)
3. Müşteri bilgilerini kaydet (musteri_kaydet fonksiyonunu kullan)
4. Geri dönüş sözü ver (geri_donum_sozu fonksiyonunu kullan)

## KURALLAR:
- SADECE işle ilgili sorulara cevap ver
- Konu dışı sorularda kibarca: "Bu konuda yardımcı olamam. Sadece işimiz ve hizmetlerimiz hakkında bilgi verebilirim." de
- Her zaman profesyonel, kibar ve yardımsever ol
- Türkçe konuş
- Kısa ve net cevaplar ver
- Müşteri bilgilerini her zaman kaydet
- Bilmediğin bir şey sorulduğunda "En kısa sürede size dönüş yapılacak" de

## HİZMETLER:
- Yazılım geliştirme
- AI/ML çözümleri
- Otomasyon sistemleri
- Danışmanlık

## ÖNEMLİ:
- Telefon numarasını Türkiye formatında al: 05XX XXX XX XX
- Müşteri adını mutlaka sor
- Her aramayı pozitif bitir
```

### 3. First Message

```
Merhaba! Open Claw'a hoş geldiniz. Ben size nasıl yardımcı olabilirim?
Randevu almak, hizmetlerimiz hakkında bilgi almak veya bir konuda destek istemek için buradayım.
```

### 4. Webhook URL

| Ortam                | URL                                    |
| -------------------- | -------------------------------------- |
| **Local (ngrok)**    | `https://xxx.ngrok.io/webhook/vapi`    |
| **Production (VPS)** | `https://your-domain.com/webhook/vapi` |

---

## Fonksiyon Tanımları (Vapi Dashboard)

### Function 1: randevu_olustur

```json
{
  "type": "function",
  "function": {
    "name": "randevu_olustur",
    "description": "Müşteri için randevu oluşturur.",
    "parameters": {
      "type": "object",
      "properties": {
        "isim": { "type": "string", "description": "Müşterinin adı ve soyadı" },
        "telefon": { "type": "string", "description": "Telefon numarası (05XX XXX XX XX)" },
        "tarih": { "type": "string", "description": "Randevu tarihi (YYYY-MM-DD)" },
        "saat": { "type": "string", "description": "Randevu saati (HH:MM)" },
        "not": { "type": "string", "description": "Ek notlar (isteğe bağlı)" }
      },
      "required": ["isim", "telefon", "tarih", "saat"]
    }
  }
}
```

### Function 2: musteri_kaydet

```json
{
  "type": "function",
  "function": {
    "name": "musteri_kaydet",
    "description": "Müşteri bilgilerini sisteme kaydeder.",
    "parameters": {
      "type": "object",
      "properties": {
        "isim": { "type": "string", "description": "Müşterinin adı ve soyadı" },
        "telefon": { "type": "string", "description": "Telefon numarası (05XX XXX XX XX)" },
        "not": { "type": "string", "description": "Müşterinin isteği veya notlar" }
      },
      "required": ["isim", "telefon", "not"]
    }
  }
}
```

### Function 3: bilgi_ver

```json
{
  "type": "function",
  "function": {
    "name": "bilgi_ver",
    "description": "İş/hizmet hakkında bilgi verir.",
    "parameters": {
      "type": "object",
      "properties": {
        "konu": { "type": "string", "description": "Müşterinin sorduğu konu" }
      },
      "required": ["konu"]
    }
  }
}
```

### Function 4: geri_donum_sozu

```json
{
  "type": "function",
  "function": {
    "name": "geri_donum_sozu",
    "description": "Müşteriye en kısa sürede geri dönüş yapılacağını kaydeder.",
    "parameters": {
      "type": "object",
      "properties": {
        "isim": { "type": "string", "description": "Müşterinin adı" },
        "telefon": { "type": "string", "description": "Telefon numarası" },
        "konu": { "type": "string", "description": "Müşterinin sorunu veya isteği" }
      },
      "required": ["isim", "telefon", "konu"]
    }
  }
}
```

---

## Test Akışları

### Test 1: Randevu

```
Kullanıcı: "Randevu almak istiyorum"
Asistan: "Tabii, adınızı ve telefon numaranızı alabilir miyim?"
Kullanıcı: "Adım Ahmet Yılmaz, telefonum 0532 123 45 67"
Asistan: "Hangi tarih ve saatte?"
Kullanıcı: "Yarın saat 14:00"
Asistan: [randevu_olustur çağırır] → "Randevunuz oluşturuldu!"
```

### Test 2: Bilgi

```
Kullanıcı: "Ne iş yapıyorsunuz?"
Asistan: "Open Claw olarak yazılım geliştirme, AI/ML çözümleri..."
```

### Test 3: Konu Dışı

```
Kullanıcı: "Bugün hava nasıl?"
Asistan: "Bu konuda yardımcı olamam. Sadece işimiz hakkında bilgi verebilirim."
```

---

## Deploy

### Local Test

```bash
# Server'ı başlat
npm run dev

# ngrok ile dış dünyaya aç
ngrok http 3000

# ngrok URL'ini Vapi Dashboard'da webhook URL olarak kullan
# Örn: https://abc123.ngrok.io/webhook/vapi
```

### Production (VPS + Coolify)

```bash
# GitHub'a push
git add .
git commit -m "feat: vapi webhook integration"
git push

# Coolify'da deploy
# Vapi Dashboard'da webhook URL güncelle:
# https://your-domain.com/webhook/vapi
```

---

## Health Check

```bash
# Server çalışıyor mu kontrol et
curl http://localhost:3000/health

# Response:
{
  "status": "ok",
  "name": "Agent Claw",
  "version": "1.0.0",
  "timestamp": "2026-03-01T..."
}
```

---

## Veri Akışı

```
Vapi Arama → Webhook → Resepsiyon Agent → Vector DB (Qdrant)
                                            ↓
                                     Müşteri kayıtları
                                     Randevu bilgileri
                                     Geri dönüş notları
```

---

## Güvenlik

- `VAPI_WEBHOOK_SECRET` ile webhook doğrulama
- Rate limiting (mevcut sistemde var)
- Input sanitization (mevcut sistemde var)

---

## Sorun Giderme

| Sorun               | Çözüm                           |
| ------------------- | ------------------------------- |
| Webhook 404         | Route doğru mu? `/webhook/vapi` |
| Function çalışmıyor | Fonksiyon isimleri match mi?    |
| Ses yok             | ElevenLabs API key doğru mu?    |
| Kayıt yok           | Qdrant bağlantısı var mı?       |

---

## Kaynaklar

- [Vapi Docs](https://docs.vapi.ai)
- [Vapi MCP Integration](https://docs.vapi.ai/tools/mcp)
- [ElevenLabs Voices](https://elevenlabs.io/voice-library)
