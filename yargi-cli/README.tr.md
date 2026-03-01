# yargi-cli

Türk hukuk veritabanları için komut satırı aracı. AI agent'lar ve programatik kullanım için tasarlandı.

> **Köken**: Bu proje, Türk hukuk veritabanlarına erişim sağlayan Python tabanlı MCP sunucusu [yargi-mcp](https://github.com/saidsurucu/yargi-mcp)'nin CLI karşılığıdır. yargi-mcp, LLM uygulamalarına Model Context Protocol üzerinden hizmet verirken, yargi-cli aynı yetenekleri bağımsız bir komut satırı aracı olarak sunar — JSON çıktı, pipe uyumlu, kimlik doğrulama gerektirmez.

🌍 [English README](./README.md)

## Neden?

AI agent'lar (LLM tool-use, otonom kodlama agent'ları, RAG pipeline'ları) Türk mahkeme kararlarını sorgulamak için basit ve öngörülebilir bir arayüze ihtiyaç duyar. yargi-cli şunları sağlar:

- **Sadece JSON çıktı** — her komut stdout'a yapılandırılmış JSON yazar
- **Pipe uyumlu** — `jq`, `xargs` veya herhangi bir Unix aracıyla zincirleme kullanım
- **Zengin `--help`** — parametre açıklamaları, arama operatörleri, çıktı şemaları ve örnekler help metnine gömülüdür, böylece agent'lar API'yi kendileri keşfedebilir
- **Auth yok, config yok** — kurulumu yapın ve çağırın

## Desteklenen Veritabanları

Şu anda **Bedesten** modülünü (bedesten.adalet.gov.tr) içerir:

| Mahkeme Türü     | Parametre           | Açıklama                  |
| ---------------- | ------------------- | ------------------------- |
| `YARGITAYKARARI` | `-c YARGITAYKARARI` | Yargıtay                  |
| `DANISTAYKARAR`  | `-c DANISTAYKARAR`  | Danıştay                  |
| `YERELHUKUK`     | `-c YERELHUKUK`     | Yerel Hukuk Mahkemeleri   |
| `ISTINAFHUKUK`   | `-c ISTINAFHUKUK`   | İstinaf Hukuk Mahkemeleri |
| `KYB`            | `-c KYB`            | Kanun Yararına Bozma      |

Daire filtreleme, tüm Yargıtay/Danıştay birimlerini kapsayan 79 kodu destekler. Tam liste için `yargi bedesten search --help` komutunu çalıştırın.

## Kurulum

```bash
# Node.js >= 24 gerektirir
npm install -g @saidsrc/yargi
```

Veya kaynak koddan çalıştırma:

```bash
git clone https://github.com/saidsurucu/yargi-cli.git
cd yargi-cli
npm install
npm run build
node bin/yargi.js bedesten search "test"
```

## Kullanım

### Karar arama

```bash
# Temel arama (varsayılan: Yargıtay + Danıştay, sayfa 1)
yargi bedesten search "mülkiyet hakkı"

# Mahkeme türü ve daire filtresi
yargi bedesten search "iş kazası" -c YARGITAYKARARI -b H9

# Tarih aralığı filtresi
yargi bedesten search "kamulaştırma" --date-start 2024-01-01 --date-end 2024-12-31

# Birden fazla mahkeme türü
yargi bedesten search "idari para cezası" -c DANISTAYKARAR YARGITAYKARARI

# Sayfalama
yargi bedesten search "tazminat" -p 3
```

### Karar tam metnini getirme

```bash
# Dökümanı Markdown olarak getir
yargi bedesten doc 1123588300

# Sadece markdown içeriğini çıkar
yargi bedesten doc 1123588300 | jq -r '.markdownContent'
```

### Pipe örnekleri

```bash
# İlk sonucun döküman ID'sini al
yargi bedesten search "mülkiyet hakkı" | jq -r '.decisions[0].documentId'

# Ara → ilk sonucun tam metnini getir
yargi bedesten search "mülkiyet hakkı" \
  | jq -r '.decisions[0].documentId' \
  | xargs yargi bedesten doc

# Bir aramadaki tüm esas numaralarını listele
yargi bedesten search "iş kazası" -c YARGITAYKARARI | jq '[.decisions[] | .esasNo]'
```

### Arama operatörleri

| Operatör      | Örnek                  | Etki                         |
| ------------- | ---------------------- | ---------------------------- |
| Basit         | `"mülkiyet hakkı"`     | Her iki kelimeyi bulur       |
| Tam cümle     | `"\"mülkiyet hakkı\""` | Tam ifadeyi bulur            |
| Zorunlu terim | `"+mülkiyet hakkı"`    | mülkiyet kelimesini içermeli |
| Hariç tutma   | `"mülkiyet -kira"`     | mülkiyet var, kira yok       |
| AND           | `"mülkiyet AND hak"`   | İkisi de zorunlu             |
| OR            | `"mülkiyet OR tapu"`   | Biri yeterli                 |
| NOT           | `"mülkiyet NOT satış"` | mülkiyet var, satış yok      |

> Joker karakterler (`*`, `?`), regex, bulanık arama (`~`) ve yakınlık araması **desteklenmez**.

## Çıktı Şemaları

### Arama çıktısı

```json
{
  "decisions": [
    {
      "documentId": "1123588300",
      "itemType": { "name": "YARGITAYKARARI", "description": "Yargıtay Kararı" },
      "birimAdi": "1. Hukuk Dairesi",
      "esasNo": "2023/6459",
      "kararNo": "2024/7158",
      "kararTarihiStr": "26.12.2024",
      "kararTarihi": "2024-12-25T21:00:00.000+00:00"
    }
  ],
  "totalRecords": 1988,
  "requestedPage": 1,
  "pageSize": 10,
  "searchedCourts": ["YARGITAYKARARI"]
}
```

### Döküman çıktısı

```json
{
  "documentId": "1123588300",
  "markdownContent": "**1. Hukuk Dairesi  2023/6459 E. ...**\n\n...",
  "sourceUrl": "https://mevzuat.adalet.gov.tr/ictihat/1123588300",
  "mimeType": "text/html"
}
```

## AI Agent'lar İçin

Bu CLI, AI agent'lar tarafından bir araç olarak çağrılmak üzere tasarlanmıştır. Önemli noktalar:

1. **Kendi kendini belgeleme**: `yargi bedesten search --help` veya `yargi bedesten doc --help` komutlarıyla tam parametre açıklamaları, geçerli değerler, çıktı şemaları ve kullanım örnekleri görüntülenir
2. **Öngörülebilir çıktı**: Her zaman stdout'a JSON, hatalar `{"error": "..."}` formatında ve sıfır olmayan çıkış koduyla
3. **Etkileşimsiz**: Asla girdi istemez, ilerleme bilgisi için stderr'e yazmaz
4. **Durumsuz**: Her çağrı bağımsızdır, oturum veya çerez yönetimi yoktur

### Tipik agent iş akışı

```
1. yargi bedesten search "<sorgu>" [-c ...] [-b ...] [--date-start ...] [--date-end ...]
2. JSON'u ayrıştır → decisions dizisinden documentId'yi çıkar
3. yargi bedesten doc <documentId>
4. JSON'u ayrıştır → markdownContent'i analiz için kullan
```

## Bağımlılıklar

| Paket       | Amaç                     |
| ----------- | ------------------------ |
| `commander` | CLI framework            |
| `turndown`  | HTML → Markdown dönüşümü |

HTTP kütüphanesi yok — Node.js native `fetch` kullanır. UI kütüphanesi yok — çıktı ham JSON'dur.

## Lisans

MIT
