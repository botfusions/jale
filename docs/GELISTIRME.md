# Agent Claw — Geliştirme Yol Haritası

> Son güncelleme: 2026-02-24 12:45
> Kaynak: github.com/steipete repoları + kendi planlarımız
> ⚠️ **Strateji:** Claude Code entegrasyonu İLK VERSİYONDA YAPILMAYACAK. OpenRouter üzerinden devam edilecek.
> 🎉 **MİLESTONE:** "One-Person Dev Team" Agent Swarm mimarisi başarıyla entegre edildi!
> 🎉 **Durum:** KRİTİK ÖNCELİK (5/5) tamamlandı! YÜKSEK ÖNCELİK'e geçiliyor.

---

## 🎯 ÖNCELİKLİ TODO LİSTESİ (Dosya Bazlı — Önem Sırasına Göre)

> Her madde için: Öncelik emojisi, hedef dosya, iş tanımı ve tahmini süre belirtilmiştir.
> ✅ = Tamamlandı | 🔲 = Bekliyor | 🔄 = Devam Ediyor

---

### 🔴 KRİTİK ÖNCELİK (Core Functionality) — ✅ TAMAMLANDI (2026-02-24)

| #   | Durum | Dosya(lar)                                                        | İş Tanımı                                                                                                                                                                        | Süre |
| --- | ----- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1   | ✅    | `src/memory/conversation-store.ts` _(YENİ)_                       | **Conversation Memory:** JSON dosyasına persist. Bot restart'ta devam. MAX_HISTORY=20, debounced write (2sn), graceful shutdown flush.                                           | 30dk |
| 2   | ✅    | `src/utils/retry.ts` _(YENİ)_ + `src/handlers/message.handler.ts` | **Error Handling + Retry:** Exponential backoff, 429/5xx/timeout/network hata yeniden deneme. Türkçe kullanıcı dostu mesajlar. Jitter ile stampede koruması.                     | 45dk |
| 3   | ✅    | `src/config/env.ts`                                               | **Env Validation Genişletme:** `MAX_TOKENS`, `TEMPERATURE`, `SYSTEM_PROMPT_PATH`, Qdrant config eklendi. `updateEnvRuntime()` ile runtime model değiştirme.                      | 30dk |
| 4   | ✅    | `src/commands/` _(6 YENİ DOSYA)_ + `src/index.ts`                 | **Modülerleştirme:** 368 satırlık monolitik index.ts → ~120 satır. Komutlar: calendar, mail, voice, tool, skill modülleri.                                                       | 1s   |
| 5   | ✅    | `src/memory/vector.service.ts`                                    | **Qdrant Gerçek Bağlantı:** `https://qdrant.turklawai.com` — Collection otomatik oluşturma, OpenRouter embedding, cosine semantic search, score_threshold=0.5. Mock mode kapalı. | 1.5s |
| 5.1 | ✅    | `src/agents/ceo-agent.ts` + `openrouter.ts`                       | **Multi-Agent Delegation:** JALE (CEO Agent) için LLM Düzeyi Tool Calling. Pazarlama Ajanı, Araştırma Ajanı gibi alt uzman botları çağırma yeteneği (`overrideModel` dahil).     | 1.5s |

---

### 🟡 YÜKSEK ÖNCELİK (Feature Development)

| #   | Durum | Dosya(lar)                        | İş Tanımı                                                                                                              | Süre |
| --- | ----- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---- |
| 6   | 🔲    | `src/skills/web-search.skill.ts`  | **Web Arama Skill'i:** DuckDuckGo/Brave Search API ile web araması. `/ara <sorgu>` komutu.                             | 1s   |
| 7   | 🔲    | `src/skills/weather.skill.ts`     | **Hava Durumu Skill'i:** OpenWeatherMap API ile `/hava <şehir>` komutu. Günlük brifinge dahil edilecek.                | 45dk |
| 8   | 🔲    | `src/skills/translator.skill.ts`  | **Çeviri Skill'i:** OpenRouter LLM üzerinden çeviri. `/cevir en>tr <metin>` formatı.                                   | 30dk |
| 9   | 🔲    | `src/skills/daily-brief.skill.ts` | **Günlük Brifing Skill'i:** Takvim + Mail + Hava durumunu birleştiren sabah brifingini otomatik hazırlama ve gönderme. | 1.5s |
| 10  | 🔲    | `src/skills/researcher.skill.ts`  | **Araştırmacı Skill'i:** Verilen konu hakkında web araması + LLM analizi ile derinlemesine rapor oluşturma.            | 2s   |

---

### 🟢 ORTA ÖNCELİK (Quality & Polish)

| #   | Durum | Dosya(lar)                       | İş Tanımı                                                                                                                                          | Süre |
| --- | ----- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 11  | 🔲    | `src/doctor/doctor.ts`           | **Doctor Gelişmiş Raporlama:** Uptime tracking, API call sayacı, hata oranı (error rate) metriği. Response time ölçümü.                            | 1s   |
| 12  | 🔲    | `src/middleware/rate-limiter.ts` | **Rate Limiter Middleware:** Kullanıcı başına mesaj sınırı. Token kullanım takibi. Maliyet hesaplama ve uyarı.                                     | 45dk |
| 13  | 🔲    | `src/llm/model-router.ts`        | **Multi-Model Router:** Görev tipine göre model seçimi. Basit sorular → ucuz model, karmaşık → pahalı model. OpenRouter üzerinden dinamik routing. | 1.5s |
| 14  | 🔲    | `src/scheduler/heartbeat.ts`     | **Heartbeat Genişletme:** Sabah brifingine hava + özet bilgi ekleme. Dünkü takvim review'u.                                                        | 45dk |
| 15  | 🔲    | `src/utils/token-counter.ts`     | **Token Sayacı:** Her LLM çağrısının token & maliyet takibi. `/maliyet` komutu ile günlük/aylık rapor.                                             | 1s   |

---

### 🔵 DÜŞÜK ÖNCELİK (Advanced Features)

| #    | Durum | Dosya(lar)                        | İş Tanımı                                                                                                                                                   | Süre |
| ---- | ----- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 16   | 🔲    | `src/skills/yargi.skill.ts`       | **Yargı CLI Entegrasyonu:** yargi-cli'yi skill olarak kaydetme. `/yargi <sorgu>` komutu.                                                                    | 1s   |
| 17   | 🔲    | `src/skills/places.skill.ts`      | **Google Places Skill'i:** goplaces ile mekan arama. `/mekan <sorgu>` komutu.                                                                               | 1s   |
| 18   | 🔲    | `src/webhook/webhook.server.ts`   | **Webhook Endpoint:** n8n'den gelen event'leri karşılama. Express/Hono minimal server.                                                                      | 2s   |
| 19   | ✅    | `.agent/`, `.clawdbot/`           | **Agent Swarm (One-Person Dev Team):** Zoe (Orchestrator) + Specialists (Codex, Claude, Gemini). PowerShell automation loop.                                | 3s   |
| 20   | 🔲    | `docker-compose.yml`              | **Redis Cache Entegrasyonu:** Conversation history ve API response cache'i Redis'e taşıma.                                                                  | 1.5s |
| 20.1 | 🔲    | `src/skills/reddit.skill.ts`      | **Reddit Fırsat Avcısı:** Reddit API ile subredditleri tarama, acı noktalarını analiz etme ve otonom SaaS fikirleri/gönderileri üretme (Human in the Loop). | 3s   |
| 20.2 | 🔲    | `src/handlers/message.handler.ts` | **Vision (Görsel Analiz) Desteği:** Telegram üzerinden fotoğrafları webhook ile alıp OpenAI/Anthropic/Google Vision modelleri ile analiz etme.              | 2s   |

---

### ⚪ GELECEK VERSİYON (v2.0 — Claude Code Entegrasyonu Sonrası)

| #   | Durum | Dosya(lar)                     | İş Tanımı                                                                                                                                                          | Süre |
| --- | ----- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| 21  | 🔲    | `src/llm/claude-code.ts`       | **Claude Code MCP Entegrasyonu:** Claude Code'u ana beyin olarak sisteme bağlama.                                                                                  | 3s   |
| 22  | ✅    | `src/agents/ceo-agent.ts`      | **JALE CEO Agent:** Tam yetki devri — strateji, görev dağıtımı.                                                                                                    | 3s   |
| 23  | ✅    | `src/agents/coo-agent.ts`      | **OSMAN COO Agent:** İş paketleme, planlama, operasyon yönetimi.                                                                                                   | 2s   |
| 24  | ✅    | `src/mcp/mcp-bridge.ts`        | **MCP Bridge:** Qdrant, Supabase, Notion MCP sunucuları köprüsü.                                                                                                   | 2s   |
| 25  | 🔲    | `src/ui/command-center/`       | **Ajan Komuta Merkezi (Dashboard):** OpenRouter LLM seçimi, persona atama ve ajan konfigürasyon (temperature vb.) yönetimi sunan Supabase entegreli Premium panel. | 1g   |
| 26  | 🔲    | `src/llm/light-rag.ts`         | **LightRAG (Opsiyonel):** Grafik tabanlı GraphRAG desteği.                                                                                                         | 4s   |
| 27  | 🔲    | `src/memory/mem0.ts`           | **Mem0 (Opsiyonel):** Akıllı hafıza katmanı ve kullanıcı tercihleri.                                                                                               | 3s   |
| 28  | 🔲    | `src/memory/memory-router.ts`  | **Memory Router:** Qdrant ve diğerleri arasında hibrit seçim.                                                                                                      | 2s   |
| 29  | 🔲    | `src/server/mobile-api.ts`     | **Custom Mobile API (YENİ):** Kendi mobil uygulamamız için REST/WebSocket API katmanı. JWT auth.                                                                   | 1g   |
| 30  | 🔲    | `mobile-app/`                  | **React Native App:** Kendi masrafsız, özel mobil uygulamamız.                                                                                                     | 3g   |
| 31  | 🔲    | `src/memory/vector.service.ts` | **Vector Isolation (Multi-Tenant):** Qdrant aramalarına `userId` filtresi ekleme (Güvenlik için kritik).                                                           | 1s   |
| 32  | 🔲    | `supabase/`                    | **User Management (SaaS):** Supabase Auth + Profiles tablosu ile üyelik sistemi.                                                                                   | 2g   |
| 33  | 🔲    | `src/middleware/tenant.ts`     | Tenant Resolver: Her isteğin hangi kullanıcıya ait olduğunu belirleyen katman.                                                                                     | 1g   |
| 34  | 🔲    | `src/agents/ceo-agent.ts`      | **Personalized Swarms (YENİ):** CEO Ajanı'nın her kullanıcıya özel farklı alt ajanlar (A, B, C) delege edebilmesi.                                                 | 2g   |
| 35  | 🔲    | `src/config/user-profiles/`    | **Persona Directory:** Kullanıcı bazlı ajan konfigürasyonları (Hangi kullanıcıda hangi botlar aktif?).                                                             | 1g   |

---

## ✅ Tamamlananlar

| Araç           | Repo                                                                     | Durum            | Açıklama                                   |
| -------------- | ------------------------------------------------------------------------ | ---------------- | ------------------------------------------ |
| gogcli         | [steipete/gogcli](https://github.com/steipete/gogcli) ⭐4,778            | ✅ Kurulu        | Gmail, Calendar, Drive, Contacts CLI       |
| ElevenLabs TTS | [steipete/ElevenLabsKit](https://github.com/steipete/ElevenLabsKit) ⭐77 | ✅ API aktif     | Sesli yanıt (ElevenLabs + OpenAI fallback) |
| Whisper STT    | OpenAI API                                                               | ✅ Aktif         | Sesli mesaj → metin dönüşümü               |
| Skill Sistemi  | —                                                                        | ✅ Altyapı hazır | `src/skills/` klasörü, manager, komutlar   |
| summarize      | [steipete/summarize](https://github.com/steipete/summarize)              | ✅ Aktif         | Web/YouTube özetleme + md arşivleme        |
| yargi-cli      | [saidsurucu/yargi-cli](https://github.com/saidsurucu/yargi-cli)          | ✅ Kurulu/Build  | Türk hukuk mercileri (Yargıtay/Danıştay)   |
| OpenRouter LLM | OpenRouter API                                                           | 💎 **ANA BEYİN** | Claude/GPT modelleri üzerinden AI yanıtlar |
| Doktor Sistemi | `src/doctor/`                                                            | ✅ Aktif         | Self-healing, api kontrol, disk temizliği  |

---

## 🏆 Öncelik 1 — Hemen Entegre Edilecekler

### 1. summarize — Web/YouTube/Podcast Özetleme

- **Repo:** [steipete/summarize](https://github.com/steipete/summarize) ⭐4,249
- **Ne yapar:** URL, YouTube videosu, podcast'i otomatik özetler
- **Dil:** TypeScript (bizimle aynı!)
- **Agent Claw'a katkısı:**
  - `/ozet <url>` — Web sayfasını özetler
  - `/ozet <youtube-link>` — Video içeriğini özetler
  - Sohbette link paylaşılınca otomatik özet
- **Tahmini süre:** 1-2 saat
- **Öncelik:** 🔴 Çok yüksek

### 2. oracle — Derin AI Sorgulama

- **Repo:** [steipete/oracle](https://github.com/steipete/oracle) ⭐1,514
- **Ne yapar:** GPT-5/Claude'a dosya + context ile derin sorgu
- **Agent Claw'a katkısı:**
  - Dosya analizi
  - Karmaşık konularda derin araştırma
  - Multi-model sorgulama
- **Tahmini süre:** 2-3 saat
- **Öncelik:** 🟡 Yüksek

### 3. goplaces — Google Places Mekan Arama

- **Repo:** [steipete/goplaces](https://github.com/steipete/goplaces) ⭐157
- **Dil:** Go
- **Agent Claw'a katkısı:**
  - "Yakındaki restoran?" → Google Places araması
  - Mekan detayları, puanlar, yorumlar
  - Konum bazlı öneriler
- **Tahmini süre:** 1-2 saat (Go build gerekli)
- **Öncelik:** 🟡 Yüksek

### 4. sag — Modern TTS CLI (ElevenLabs)

- **Repo:** [steipete/sag](https://github.com/steipete/sag) ⭐193
- **Dil:** Go
- **Ne yapar:** macOS `say` komutu ama ElevenLabs sesiyle
- **Agent Claw'a katkısı:**
  - TTS için alternatif/yedek CLI aracı
  - Daha iyi ses kalitesi kontrolü
- **Tahmini süre:** 30 dk
- **Öncelik:** 🟢 Orta (zaten ElevenLabs API kullanıyoruz)

### 5. agent-scripts — Agent Script Koleksiyonu

- **Repo:** [steipete/agent-scripts](https://github.com/steipete/agent-scripts) ⭐2,045
- **Ne yapar:** AI agent'lar için hazır script'ler
- **Agent Claw'a katkısı:**
  - Hazır pattern ve best practice'ler
  - Otomasyon script'leri
- **Tahmini süre:** İnceleme + cherry-pick
- **Öncelik:** 🟢 Orta

---

## 🥈 Öncelik 2 — İleri Aşama

### 6. wacli — WhatsApp CLI

- **Repo:** [steipete/wacli](https://github.com/steipete/wacli) ⭐522
- **Dil:** Go
- **Agent Claw'a katkısı:**
  - WhatsApp entegrasyonu
  - Telegram dışında ikinci mesajlaşma kanalı
- **Bağımlılık:** WhatsApp Web oturumu
- **Öncelik:** 🟢 Orta

### 7. vox — Telefon Araması CLI

- **Repo:** [steipete/vox](https://github.com/steipete/vox) ⭐27
- **Dil:** TypeScript
- **Agent Claw'a katkısı:**
  - Bot üzerinden telefon araması yapma
  - Sesli asistan → telefon köprüsü
- **Öncelik:** 🔵 Düşük (gelişmiş özellik)

### 8. metcli — Meta/Facebook Veri Çekme

- **Repo:** [steipete/metcli](https://github.com/steipete/metcli) ⭐24
- **Agent Claw'a katkısı:**
  - Facebook/Instagram veri analizi
  - Sosyal medya izleme
- **Öncelik:** 🔵 Düşük

### 9. Peekaboo — Screenshot + AI Analiz (macOS)

- **Repo:** [steipete/Peekaboo](https://github.com/steipete/Peekaboo) ⭐2,319
- **Platform:** Yalnızca macOS
- **Agent Claw'a katkısı:**
  - Ekran görüntüsü alıp AI'a analiz ettirme
  - VPS'e taşındığında Linux alternatifi gerekir
- **Öncelik:** 🔵 Düşük (platform bağımlı)

### 10. imsg — iMessage CLI (macOS)

- **Repo:** [steipete/imsg](https://github.com/steipete/imsg) ⭐749
- **Platform:** Yalnızca macOS
- **Öncelik:** 🔵 Düşük (platform bağımlı)

---

## 🧩 Skill Sistemi Planı

Skill altyapısı hazır (`src/skills/`). Yukarıdaki araçlar skill olarak eklenecek:

```
src/skills/
├── skill-manager.ts       ← ✅ Hazır
├── index.ts               ← ✅ Hazır (boş, skill'ler eklenecek)
├── summarizer.skill.ts    ← 📋 summarize entegrasyonu
├── places.skill.ts        ← 📋 goplaces mekan arama
├── oracle.skill.ts        ← 📋 derin sorgulama
├── translator.skill.ts    ← 📋 çeviri
├── weather.skill.ts       ← 📋 hava durumu
├── daily-brief.skill.ts   ← 📋 günlük brifing (takvim+mail+hava)
├── researcher.skill.ts    ← 📋 **Researcher Modülü** (Özel LLM + Uzmanlık)
├── yargi.skill.ts         ← 📋 yargi-cli entegrasyonu
└── web-search.skill.ts    ← 📋 web araması
```

---

## 📌 Mevcut Agent Claw Komutları

| Komut               | Açıklama                | Durum |
| ------------------- | ----------------------- | ----- |
| `/start`            | Hoş geldin              | ✅    |
| `/help`             | Yardım menüsü           | ✅    |
| `/status`           | Bot durumu              | ✅    |
| `/remember <metin>` | Hafızaya kaydet         | ✅    |
| `/recall <sorgu>`   | Hafızadan getir         | ✅    |
| `/today`            | Bugünkü takvim          | ✅    |
| `/calendar`         | Yarınki takvim          | ✅    |
| `/week`             | Haftalık takvim         | ✅    |
| `/mail`             | Okunmamış e-postalar    | ✅    |
| `/mailoku`          | E-postaları sesli oku   | ✅    |
| `/todayoku`         | Takvimi sesli oku       | ✅    |
| `/voice <metin>`    | Metni sesli söyle       | ✅    |
| `/skills`           | Skill listesi           | ✅    |
| `/skill <isim>`     | Skill aç/kapat          | ✅    |
| `/ozet <url>`       | Web sayfasını özetle    | ✅    |
| `/doctor`           | Sistemi tarar ve onarır | ✅    |
| `/heartbeat_test`   | Günlük hatırlatma testi | ✅    |
| 🎤 Sesli mesaj      | Otomatik sesli yanıt    | ✅    |

---

## 🗓️ Sonraki Adımlar

1. [x] ~~Conversation History Persistence~~ ✅
2. [x] ~~Error Handling + Retry~~ ✅
3. [x] ~~Env Validation Genişletme~~ ✅
4. [x] ~~Modülerleştirme / Command Router~~ ✅
5. [x] ~~Qdrant vector DB aktif etme (gerçek hafıza)~~ ✅
6. [x] ~~Web Arama Skill'i (TODO #6)~~ ✅
7. [x] ~~Hava Durumu Skill'i (TODO #7)~~ ✅
8. [x] ~~Çeviri Skill'i (TODO #8)~~ ✅
9. [x] ~~Günlük Brifing Skill'i (TODO #9)~~ ✅
10. [ ] Araştırmacı Skill'i (TODO #10)
11. [ ] Contabo VPS'e deploy
12. [ ] WhatsApp entegrasyonu (wacli)

---

## 🏢 AI Holding Senaryosu & Mimari Öngörüler (Vizyon)

Şu an üzerinde düşündüğümüz ve Agent Claw'u bir "Dijital Holding" yapısına taşıyacak olan organizasyon şeması:

### 1. Yönetim Kadrosu

- **💎 JALE (CEO - Claude Code / Opus 4.6):** Ana yönetici asistanı. Tüm sistemi idare eder, stratejik kararları alır ve kullanıcı (Patron) ile muhatap olur.
- **📋 OSMAN (COO - GPT-5.2):** Stratejik planlama birimi. Jale'den gelen hedefleri iş paketlerine böler, takvimi ve operasyon akışını yönetir.

### 2. Departmanlar & Skill Ajanları (Worker Agents)

Osman'ın planlarını uygulayan, düşük maliyetli (Kimi-k2.5 / Gemini Flash) modellerle çalışan uzman birimler:

- **⚖️ Hukuk Birimi (yargi-cli):** Emsal kararları bulur ve hukuki analiz yapar.
- **🔍 Lead/Scraping Birimi (Kazım):** Web kazıma, lead toplama ve firma araştırması yapar.
- **📧 Cold Mail Birimi (Mektupçu):** Kişiye özel mail taslakları hazırlar (Gmail entegrasyonu).
- **🎨 Pazarlama/Reklam:** Görsel üretimi ve kampanya sloganları hazırlar.

### 3. Destek Birimleri

- **🧐 Denetçi (Quality Control):** Diğer ajanların çıktılarını (mail, analiz vb.) denetler, hata payını minimize eder.
- **🗄️ Arşivci (Knowledge Manager):** Yapılan her işi `summaries/` klasörüne ve Qdrant hafızasına kaydeder.

### 💰 Maliyet-Dostu Mimari (Cost-Aware)

- **Katmanlı Kullanım:** Sadece Jale ve Osman gibi "beyin" rollerinde pahalı modeller (Opus/GPT-5) kullanılır.
- **Hamallık İşleri:** Veri işleme, özetleme ve dosya tasnifi gibi işler ucuz/hızlı modellerle (Moonshot Kimi, Gemini Flash) halledilir.
- **Hafıza Önceliği:** Aynı işi tekrar yapmamak için önce Arşivci'nin kayıtları (cached) sorgulanır.

### ⛓️ Webhook & n8n Bağlantı Hattı (Automation Pipeline)

Sistemi dış dünya ile konuşturan ana arter:

- **Trigger (Tetikleyici):** n8n üzerinden gelen sinyaller (LinkedIn lead, Sheet güncellemesi, G-Mail alarmı).
- **Pipeline:** Gelen veri anında JALE'ye (CEO) iletilir. JALE iş emrini birimlere dağıtır.
- **Headless Operasyon:** Telegram'dan bağımsız, arka planda 7/24 operasyon yürütebilir.

### 🛠️ MCP Araç Katmanı (Direct Tooling)

Jale'nin (Claude Code) doğrudan kullandığı "elleri". MCP sayesinde binlerce servis bota bağlanır:

- **Hafıza:** Qdrant/Supabase MCP'leri ile yüksek kapasiteli vektör hafıza.
- **Arama:** Google/Brave Search MCP ile canlı web verisi.
- **Ofis:** Notion, Slack, Drive MCP'leri ile kurumsal entegrasyon.
- **Geliştirici Araçları:** Local Filesystem ve Shell MCP ile sunucu üzerinde tam yetkili operasyon.

### 🛡️ Güvenlik ve Etik Protokolleri (Security First)

Sistemin dışarı açıldığı noktada (Webhook) ve içeride (Agent Operation) uygulanan zırh katmanları:

- **Webhook Güvenliği:**
  - `X-Claw-Secret` token doğrulaması (Sadece yetkili n8n/zapier istekleri).
  - IP filtrasyonu ve Rate Limiting (DoS koruması).
- **AgentGuard (İnsan Onayı):**
  - Kritik işlemler (Mail gönderimi, dosya silme, ödeme) için kullanıcıdan (Patron) Telegram üzerinden butonlu onay alınır.
- **Prompt Injection Koruması:**
  - Dış kaynaklı veriler (web özetleri, webhook datası) asla "yürütülebilir komut" olarak işlenmez, sadece "veri" olarak analiz edilir.
- **İzolasyon & Kısıtlama:**
  - MCP araçlarının erişimi sadece `Open Claw` proje klasörü ile sınırlıdır.
  - API anahtarları (`.env`) sadece Jale (CEO) tarafından erişilebilir, alt ajanlar bu anahtarları görmez.

### 🎛️ Ajan Komuta Merkezi (Command Center Dashboard)

Sistemin kalbi olan ajanları tek bir noktadan yönetmek için modern, **"wow" dedirtecek** kalitede premium bir web arayüzü (Command Center) geliştirilecek. Ajanlar göreve başlamadan önce rollerini ve hangi donanımı (LLM motoru) kullanacaklarını ana veritabanından (Supabase) anlık olarak çekecek.

- **Dinamik Model Yönetimi (OpenRouter):** Statik model listeleri yerine OpenRouter üzerinden kullanılabilir güncel modeller canlı olarak çekilecek. Her ajan için model ataması panelden dinamik yapılacak.
- **Karakter Stüdyosu (Persona Management):** Her bir ajanın _System Prompt_ (Karakter tanımı), _Temperature_ (Yaratıcılık tavanı) gibi özlük ayarları panelden UI üzerinden düzenlenebilecek.
- **Modern UI/UX Yaklaşımı:** Glassmorphism ve dark mode ağırlıklı, mikro-animasyonlarla zenginleştirilmiş premium arayüz tasarımı kullanılacak.
- **Merkezi Veritabanı:** Bu panelin yönettiği tüm yapılandırma verileri (`agents_config`) Supabase üzerinde anlık senkronizedir. Bu sayede ajana kod müdahalesi gerekmeden model, rol ve yetenek atanmış olur.

### 🚀 Üretim Altyapısı (Production Infrastructure) - **[HAZIR]**

Sistemin 7/24 kesintisiz ve yüksek performansla çalışacağı "Ana Merkezin" teknik özellikleri ve **Coolify** ile Contabo VPS üzerine kurulum adımları:

- **Sunucu:** Contabo VPS (High Performance). 8 vCPU / 24 GB RAM.
- **Yönetim Paneli:** **Coolify** (Kendi kendine barındırılan Vercel/Heroku alternatifi).
- **Servisler:** Bot (CEO), n8n (Pipeline), Redis (Hafıza Cache) konteynerize edildi.
- **Paketleme:** `Dockerfile` ve `docker-compose.yml` hazırlandı.

#### Contabo + Coolify Deployment Adımları

1. **Sunucu Hazırlığı & Coolify Kurulumu:**
   - Contabo VPS'inize Ubuntu/Debian kurun ve SSH ile bağlanın.
   - Resmi kurulum komutunu çalıştırarak Coolify'ı yükleyin:
     `curl -fsSL https://get.coollabs.io/coolify/install.sh | bash`
   - Kurulum bitince `http://<IP-ADRESI>:8000` üzerinden panele erişin.

2. **Proje Ekleme (Docker Compose):**
   - Coolify panelinde **Create New Shared Resource** veya **Add New Resource** diyerek **Docker Compose** (veya GitHub repository'niz üzerinden Public/Private repo) seçin.
   - Projenin kök dizinindeki `docker-compose.yml` dosyasını gösterin (Coolify otomatik olarak parse eder).

3. **Özelleştirilmiş Environment Variables (.env):**
   - Coolify arayüzünden projenizin ayarlarındaki (Environment Variables sekmesi) tüm `TELEGRAM_BOT_TOKEN`, `MODEL_API_KEY`, Supabase/Qdrant anahtarlarını yapıştırın.
   - `.env` gizli olduğu için bu adım manuel yapılmalıdır.

4. **Deploy İşlemi:**
   - "Deploy" butonuna basıldığında Coolify `agent-claw`, `redis`, ve `n8n` servislerini ayaklandıracak.
   - Ajan loglarını (özellikle `/doctor` metriklerini) yine paneldeki "Logs" sekmesinden veya Telegram komutuyla anlık takip edebilirsiniz.

### 🔮 Öngörüler: CLI, MCP ve Dışa Açılım Güvenliği

**Gelecek Vizyonu:**
Yapay zeka modelleri (LLM'ler), insanlar için tasarlanmış web arayüzleri yerine tamamen metin tabanlı olan CLI (Komut Satırı Arayüzü) araçlarını ve MCP (Model Context Protocol) sunucularını çok daha doğal ve efektif kullanırlar. "Eski" (legacy) olarak görülen CLI araçları aslında ajanlar için kusursuz bir oyun alanıdır.

**Open Claw / AI Holding İçin Fırsatlar:**

- **Araç Kullanımı:** Sistemimizdeki ajanlara sadece gerekli CLI araçlarını (GitHub CLI, AWS CLI vb.) sağlayarak terminal üzerinden kompleks işler yaptırabiliriz (Örn: "Github'daki issue'ları oku, kod yaz, PR aç").
- **MCP Entegrasyonu:** Supabase, Reddit, Pinecone gibi MCP sunucuları ile ajanlar dış dünyayı ve veritabanlarını manipüle edebilir.
- **Dışarıya Açılma:** Kendi projemiz için de bir `open-claw-cli` veya özel bir MCP sunucusu yazarak; diğer insanların yapay zeka ajanlarının bizim sunduğumuz hizmetleri (fatura okuma, lead analizi vb.) kullanmasını sağlayabiliriz.

**Güvenlik Yaklaşımı (Sistemi Dünyaya Açarken):**
Eğer Open Claw CLI/MCP servislerini dış dünyaya açarsak karşılaşacağımız riskler ve çözümleri:

1. **Kimlik Doğrulama:** CLI/Ajanlar asla doğrudan veritabanına bağlanmaz. Güvenli API'ye JWT Token veya API Key ile istek atarlar. Supabase RLS ile sadece yetkili verilere erişim sağlanır.
2. **Kötüye Kullanım / Aşırı Maliyet:** API katmanında "Rate Limiting" (istek sınırı) ve "Kredi/Kontör" sistemi uygulanarak LLM faturalarının şişmesi ve DDoS saldırıları engellenir.
3. **Sınırlandırılmış Kapsam (Scopes):** Sadece "Okuma Yetkili" veya belirli işlemlere izin veren kısıtlı API anahtarları oluşturularak risk minimize edilir.
4. **Veri Doğrulama:** Dışarıdan veya ajanlardan gelen her veri Zod gibi kütüphaneler ile sıkı bir doğrulamadan geçirilir (Input Validation).

---

> 💡 **Not:** Bu yapı `Claude Code`'un ana beyin olarak sisteme bağlanması ve `n8n` / `MCP` / `Güvenlik` / `Altyapı` katmanlarının entegre edilmesiyle "Agent Swarm" yapısı kademeli olarak hayata geçirilecektir.
