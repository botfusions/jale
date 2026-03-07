# 👸 Jale AI — Akıllı Ekosistem ve Swarm Asistanı

> **Adres:** [asistan.turklawai.com](https://asistan.turklawai.com)

> Jale AI, sıradan bir Telegram botundan fazlasıdır. Jale (CEO) liderliğinde; finans (KAYA), araştırma (AYÇA), hukuk (AVUKAT KEMAL) ve yazılım (MEHMET) uzmanlarından oluşan **Visible Swarm** mimarisi ile fiziksel ve dijital ekosisteminizi yönetir.

---

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Mimari](#-mimari)
- [Ajanlar & Personalar](#-ajanlar--personalar)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Kurulum](#-kurulum)
- [Komutlar](#-komutlar)
- [Hafıza Sistemi](#-hafıza-sistemi)
- [Borsa & Haber (KAYA)](#-borsa--haber-kaya)
- [Yetenekler (Skills)](#-yetenekler-skills)

---

## 🌟 Öne Çıkan Özellikler

| Özellik                  | Durum    | Açıklama                                              |
| ------------------------ | -------- | ----------------------------------------------------- |
| 👸 Jale AI (CEO)         | ✅ Aktif | Tüm ajanları koordine eden merkezi zeka               |
| 📈 KAYA (Borsacı)        | ✅ Aktif | BIST, KAP Haberleri, Kripto ve Warren Buffett analizi |
| 🕵️‍♀️ AYÇA (Araştırmacı)    | ✅ Aktif | Brave Search + Scrapling ile internetten canlı veri   |
| ⚖️ AVUKAT KEMAL          | ✅ Aktif | Yargı mevzuatı ve hukuki karar arama                  |
| 💻 RECEP (Yazılım)       | ✅ Aktif | Terminal erişimi, paket kurulumu ve Git yönetimi      |
| 🧠 Visible Swarm         | ✅ Aktif | Ajanların birbirleriyle konuşup karar alma yeteneği   |
| 🎤 Sesli Kontrol         | ✅ Aktif | Whisper transkripsiyon ve ElevenLabs TTS              |
| 📅 Workspace Entegrasyon | ✅ Aktif | Google Calendar & Gmail (clasp) tam entegrasyon       |
| ⚡ Otonom Yetenekler     | ✅ Aktif | Skills sistemi ile her türlü API ve CLI entegrasyonu  |

---

## 🏗️ Mimari (Visible Swarm)

Jale AI, **Visible Swarm** konseptini kullanır. Her ajan kendi uzmanlık alanına sahiptir ve Jale'nin koordinasyonunda çalışır.

- **JALE (CEO):** Ekosistemin beyni. Diğer ajanlara iş atar, strateji belirler. Diğer ajanların loglarını izler ve fiziksel ekosistemi (ev/ofis/donanım) yönetir.
- **KAYA (Borsacı):** Finansal dahidir. `borsaci` CLI aracını kullanarak gerçek zamanlı fiyat, KAP haberi ve ekonomik takvim verilerini çeker.
- **AYÇA (Araştırmacı):** İnternetin "gözü"dür. **Brave Search API** ve **Scrapling** kütüphanesi ile web sayfalarını otonom bir şekilde tarar.
- **RECEP (Backend):** Sistem yöneticisidir. Kod yazar, `npm` paketlerini kurar, sunucu güvenliğini denetler ve `git` işlemlerini yapar.
- **AVUKAT KEMAL:** Hukuki danışmandır. Mevzuat tarar ve risk analizi sunar.

---

## 🛠️ Teknoloji Yığını

- **Dil:** TypeScript (Node.js 20+)
- **LLM:** OpenRouter (Claude 3.5 Sonnet, GPT-4o, Llama 3.3)
- **Veritabanı:** Qdrant (Vektör Hafıza), JSON (Sohbet Geçmişi)
- **Web Tarama:** Brave Search API + Scrapling (Python tabanlı hızlı tarayıcı)
- **Finansal Veri:** `kaya` CLI (Python/uv run) → BIST, KAP, TEFAS
- **Ses:** OpenAI Whisper (Transcription), ElevenLabs (TTS)
- **Entegrasyon:** Google Workspace (clasp), Vapi (Sesli Telefon)

---

## 🚀 Hızlı Başlangıç

### Ön Koşullar

- **Node.js 20+**
- **Python 3.10+** (KAYA ve Scrapling için)
- **uv** (Python paket yönetimi için önerilir)

### Kurulum

```bash
# Repo'yu klonlayın
git clone https://github.com/kullanici/jale-ai.git
cd jale-ai

# Bağımlılıkları yükle
npm install

# KAYA (Borsacı) kurulumu
cd borsaci
uv sync
cd ..

# .env dosyasını oluştur ve düzenle
cp .env.example .env
```

---

## 📱 Komutlar & Yetenekler

| Komut            | Kiminle Konuşursun? | Ne Yapar?                                      |
| ---------------- | ------------------- | ---------------------------------------------- |
| `/jale <mesaj>`  | JALE (CEO)          | Stratejik ve fiziksel ekosistem yönetimi       |
| `/recep <mesaj>` | RECEP (Yazılım)     | Kod, kurulum ve terminal işlemleri             |
| `/osman <mesaj>` | OSMAN (COO)         | Proje planlama ve operasyonel akışlar          |
| `/yargi <mesaj>` | KEMAL (Hukuk)       | Mevzuat ve yargı kararları sorgulama           |
| `/status`        | Sistem              | Tüm ajanların ve servislerin durumunu raporlar |

---

## 🔐 Güvenlik & Gizlilik

Jale AI, verilerinizin gizliliğini her şeyin önünde tutar:

- **Allowlist:** Sadece sizin belirlediğiniz Telegram ID'leri erişebilir.
- **Secret Masking:** Loglarda API keyleri asla açık görünmez.
- **Safe Execution:** Terminal komutları (Recep) önce güvenlik filtresinden geçer.

---

## 📄 Lisans

ISC - 2026 Jale AI Team

---

_Built with ❤️ by Visible Swarm Engineering_
