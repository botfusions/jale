# MCP Integration Guide — Agent Claw

## Güvenli MCP Entegrasyon Prensibi (Principle of Least Privilege)

### Temel Kurallar

1. **Minimum Yetki:** Her araç yalnızca ihtiyaç duyduğu izinlere sahip olmalı.
2. **Salt Okunur Öncelik:** Mümkünse salt okunur (read-only) erişim tercih edin.
3. **Log Redaksiyon:** Hassas alanlar (email body, kişisel veri) loglanmamalı.
4. **Allowlist Komutlar:** Yalnızca onaylanan komutlar çalıştırılabilir.
5. **Üçüncü Taraf Sınırı:** Hassas veriler asla dış servislere gönderilmemeli.

---

## Araç Bağlantı Checklist (Her Araç İçin)

### 1. Planlama

- [ ] Aracın amacını tanımlayın (örn: "Yarınki etkinlikleri oku")
- [ ] Gerekli minimum izinleri belirleyin
- [ ] Veri akışını haritalandırın (hangi veri nereye gidiyor?)
- [ ] Riskli alanları işaretleyin

### 2. Kimlik Doğrulama

- [ ] API credential'ları yalnızca env variable'dan okunuyor
- [ ] OAuth scope'ları minimum düzeyde
- [ ] Token'lar loglanmıyor
- [ ] Service account kullanılıyor (kişisel hesap değil)

### 3. Veri Güvenliği

- [ ] Hassas alanlar (email, password, CC) filtreleniyor
- [ ] Log'lara yalnızca metadata yazılıyor (event count, timestamp)
- [ ] Üçüncü taraflara veri gönderilmiyor
- [ ] Geçici dosyalar siliniyor

### 4. Hata Yönetimi

- [ ] API hataları kullanıcıya güvenli mesajla dönüyor
- [ ] Stack trace'ler production'da gizli
- [ ] Rate limiting uygulanıyor
- [ ] Timeout ayarlanmış

### 5. Test

- [ ] Mock modda test edildi
- [ ] Gerçek API ile sandbox test edildi
- [ ] Telegram'dan uçtan uca test edildi
- [ ] Hata senaryoları test edildi

---

## Desteklenen Araçlar

| Araç            | Durum     | Erişim Tipi | Öncelik |
| --------------- | --------- | ----------- | ------- |
| Google Calendar | ✅ Hazır  | Salt Okunur | Yüksek  |
| Gmail           | 🔲 Planlı | Salt Okunur | Orta    |
| Google Drive    | 🔲 Planlı | Salt Okunur | Düşük   |
| Notion          | 🔲 Planlı | Okuma/Yazma | Orta    |

---

## Google Calendar Entegrasyon Adımları

### Ön Koşullar

1. Google Cloud Console'da proje oluşturun
2. Calendar API'yi etkinleştirin
3. Service Account oluşturun
4. JSON key dosyasını indirin
5. Takvimi service account ile paylaşın (Reader)

### Yapılandırma

```env
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_CALENDAR_ID=primary
GOOGLE_SERVICE_ACCOUNT_JSON=<JSON key içeriği>
```

### Test Prompt'u (Telegram'da)

```
/calendar
```

veya doğal dilde:

```
Yarın takvimimde ne var?
```

### Güvenlik Notları

- ❌ Etkinlik oluşturma, düzenleme, silme YOK
- ❌ Katılımcı e-postaları loglanmaz
- ❌ Etkinlik açıklamaları özetlenmez (başlık + saat yeterli)
- ✅ Yalnızca event summary, start time, end time, location döner
