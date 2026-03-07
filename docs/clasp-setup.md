# Google Workspace CLI (`clasp`) Kullanım Rehberi

`clasp` (Command Line Apps Script Projects), Google Apps Script projelerinizi yerel ortamdan yönetmenize, kod yazmanıza ve dağıtmanıza (deploy) olanak tanıyan bir araçtır. Projemizde Google Takvim ve Gmail entegrasyonları için `gogcli` yerine bu modern araç tercih edilmiştir.

## 🚀 Başlangıç

### 1. Google Hesabı ile Giriş Yapma

Terminalinize şu komutu yazın:

```bash
npx clasp login
```

Bu komut tarayıcınızı açacak ve Google hesabınızla giriş yapmanızı isteyecektir. İzinleri onayladıktan sonra `clasp` yetkilendirilmiş olacaktır.

### 2. Apps Script API'sini Etkinleştirme

`clasp`'ın çalışabilmesi için Google hesabınızda Apps Script API'sinin açık olması gerekir:

- [script.google.com/home/settings](https://script.google.com/home/settings) adresine gidin.
- **Google Apps Script API** seçeneğini **Açık (On)** konuma getirin.

## 🛠 Temel Komutlar

### Proje Oluşturma

Yeni bir Apps Script projesi başlatmak için:

```bash
npx clasp create --title "Benim Projem" --type sheets
```

### Mevcut Projeyi Çekme (Clone)

Eğer halihazırda bir `scriptId`'niz varsa:

```bash
npx clasp clone <scriptId>
```

### Kodları Google'a Gönderme (Push)

Yazdığınız yerel kodları Apps Script paneline yüklemek için:

```bash
npx clasp push
```

### Kodları Google'dan Çekme (Pull)

Web panelinde yaptığınız değişiklikleri yerel dosyalarınıza indirmek için:

```bash
npx clasp pull
```

## 🔐 Güvenlik ve VPS Kullanımı

VPS üzerinde çalışırken `npx clasp login` komutu tarayıcı açamayabilir. Bu durumda:

1. Kendi yerel bilgisayarınızda `npx clasp login` yapın.
2. Oluşan `~/.clasprc.json` dosyasını VPS'deki kullanıcı ana dizinine kopyalayın.

## 📁 Dosya Yapısı

- `.clasp.json`: Proje ayarlarını ve `scriptId` bilgisini tutar.
- `appsscript.json`: Proje manifestosudur (izinler, zaman dilimi vb.).

Daha fazla bilgi için: [clasp GitHub](https://github.com/googleworkspace/cli)
