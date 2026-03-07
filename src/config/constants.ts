export const APP_NAME = 'Jale AI';
export const APP_VERSION = '1.1.0';
export const APP_EMOJI = '👸';

export const MAX_CONTEXT_TOKENS = 4096;
export const MAX_MEMORY_RESULTS = 5;
export const MAX_CALENDAR_EVENTS = 5;

export const COMMANDS = {
  START: 'start',
  HELP: 'help',
  REMEMBER: 'remember',
  RECALL: 'recall',
  HEARTBEAT_TEST: 'heartbeat_test',
  STATUS: 'status',
  DOCTOR: 'doctor',
  JALE: 'jale',
  OSMAN: 'osman',
  RESEARCH: 'research',
} as const;

// Voice reply triggers — any of these in the user message activates TTS
export const VOICE_TRIGGERS = [
  'reply with voice',
  'sesli yanıtla',
  'sesli yanıt',
  'sesli cevap',
  'sesli cevapla',
  'sesli söyle',
  'sesle yanıtla',
  'sesle cevapla',
  'voice reply',
];

export const MESSAGES = {
  WELCOME: `${APP_EMOJI} Merhaba! Ben **Jale**. Senin kişisel AI asistanın ve ekosistem liderinim.\n\nBana metin veya sesli mesaj gönderebilirsin. Yardım için /help yaz.`,
  HELP: [
    `${APP_EMOJI} **Botfusions İşletim Sistemi Komutları:**\n`,
    '💬 **Sohbet:**',
    '/start — Hoş geldin mesajı',
    '/help — Bu yardım menüsü',
    '/status — Bot durumu',
    '',
    '🧠 **Hafıza:**',
    '/remember <metin> — Hafızaya kaydet',
    '/recall <sorgu> — Hafızadan getir',
    '',
    '📅 **Takvim:**',
    '/today — Bugünkü etkinlikler',
    '/calendar — Yarınki etkinlikler',
    '/week — Bu haftanın etkinlikleri',
    '',
    '📧 **E-posta:**',
    '/mail — Son okunmamış e-postalar',
    '/mailoku — E-postaları sesli oku 🔊',
    '',
    '🔊 **Sesli Yanıt:**',
    '/voice <metin> — Metni sesli söyle',
    '/todayoku — Bugünkü takvimi sesli oku',
    'veya mesajınıza "sesli yanıtla" ekleyin',
    '',
    '💓 **Diğer:**',
    '/ozet <url> — Web sayfasını özetle',
    '/doctor — Doktor: Sistemi tara ve kendini düzelt 🔧',
    '/heartbeat\\_test — Günlük hatırlatma testi',
    '',
    '🤖 **Araştırma ve Ajanlar:**',
    '/jale <strateji sorusu> — CEO JALE ile görüş',
    '/osman <planlama> — COO OSMAN ile plan yap',
    '/research <konu> — Araştırmacı ajanla derin bilgi topla',
  ].join('\n'),
  UNAUTHORIZED: '⛔ Bu bot yalnızca yetkilendirilmiş kullanıcılar içindir.',
  TRANSCRIPTION_FAILED:
    '⚠️ Ses dosyası yazıya çevrilemedi. Lütfen tekrar deneyin veya metin olarak gönderin.',
  NO_EVENTS: '📅 Yarın için planlanmış etkinlik yok.',
  VOICE_REPLY_TRIGGER: 'reply with voice', // kept for backward compat
} as const;
