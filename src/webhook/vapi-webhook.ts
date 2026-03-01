/**
 * Vapi Webhook Handler
 *
 * Vapi'den gelen function call'ları karşılar ve Resepsiyon Agent'a yönlendirir.
 *
 * Endpoint: POST /webhook/vapi
 */

import { Request, Response } from 'express';
import { ReceptionistAgent } from '../agents/receptionist-agent';
import { safeLog, safeError } from '../utils/logger';

const receptionist = new ReceptionistAgent();

/**
 * Vapi Webhook Request Format
 */
interface VapiWebhookRequest {
  message: {
    type: 'function-call' | 'status-update' | 'hang' | 'speech-update' | 'transcript';
    callId?: string;
    functionCall?: {
      name: string;
      parameters: Record<string, any>;
    };
    status?: string;
    transcript?: string;
  };
}

/**
 * Vapi Webhook Response Format
 */
interface VapiWebhookResponse {
  result?: string;
  error?: string;
}

/**
 * Handle Vapi webhook requests
 */
export async function handleVapiWebhook(
  req: Request<VapiWebhookRequest>,
  res: Response<VapiWebhookResponse>
): Promise<void> {
  try {
    const { message } = req.body;

    safeLog('Vapi webhook received', { type: message.type, callId: message.callId });

    // Handle different message types
    switch (message.type) {
      case 'function-call':
        const result = await handleFunctionCall(message.functionCall!, message.callId);
        res.json({ result });
        break;

      case 'status-update':
        safeLog('Call status update', { callId: message.callId, status: message.status });
        res.json({ result: 'Status acknowledged' });
        break;

      case 'transcript':
        safeLog('Call transcript', { callId: message.callId, transcript: message.transcript });
        if (message.transcript) {
           // Konuşmayı Jale'nin de hatırlayabileceği ortak hafızaya kaydet
           await receptionist.saveTranscript(message.transcript, message.callId);
        }
        res.json({ result: 'Transcript received' });
        break;

      case 'hang':
        safeLog('Call ended', { callId: message.callId });
        res.json({ result: 'Call ended' });
        break;

      default:
        safeError('Unknown Vapi message type', { type: (message as any).type });
        res.status(400).json({ error: 'Unknown message type' });
    }
  } catch (error: any) {
    safeError('Vapi webhook error', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Handle function calls from Vapi
 */
async function handleFunctionCall(
  functionCall: { name: string; parameters: Record<string, any> },
  callId?: string
): Promise<string> {
  const { name, parameters } = functionCall;

  safeLog('Processing function call', { name, parameters, callId });

  try {
    switch (name) {
      case 'randevu_olustur':
        return await receptionist.createAppointment(
          parameters.isim,
          parameters.telefon,
          parameters.tarih,
          parameters.saat,
          parameters.not
        );

      case 'musteri_kaydet':
        return await receptionist.saveCustomer(
          parameters.isim,
          parameters.telefon,
          parameters.not,
          callId
        );

      case 'bilgi_ver':
        return await receptionist.getInfo(parameters.konu);

      case 'geri_donum_sozu':
        return await receptionist.promiseCallback(
          parameters.isim,
          parameters.telefon,
          parameters.konu
        );

      default:
        return `Bilinmeyen fonksiyon: ${name}`;
    }
  } catch (error: any) {
    safeError('Function call failed', { name, error: error.message });
    return `Hata: ${error.message}`;
  }
}

/**
 * Vapi function definitions (Vapi Dashboard'da kullanılacak)
 */
export const VAPI_FUNCTIONS = [
  {
    type: 'function',
    function: {
      name: 'randevu_olustur',
      description: 'Müşteri için randevu oluşturur. Tarih ve saat belirtilmeli.',
      parameters: {
        type: 'object',
        properties: {
          isim: {
            type: 'string',
            description: 'Müşterinin adı ve soyadı',
          },
          telefon: {
            type: 'string',
            description: 'Müşterinin telefon numarası (Türkiye formatı: 05XX XXX XX XX)',
          },
          tarih: {
            type: 'string',
            description: 'Randevu tarihi (YYYY-MM-DD formatında)',
          },
          saat: {
            type: 'string',
            description: 'Randevu saati (HH:MM formatında)',
          },
          not: {
            type: 'string',
            description: 'Randevu ile ilgili ek notlar (isteğe bağlı)',
          },
        },
        required: ['isim', 'telefon', 'tarih', 'saat'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'musteri_kaydet',
      description: 'Müşteri bilgilerini sisteme kaydeder. Geri dönüş yapılacak müşteriler için kullanılır.',
      parameters: {
        type: 'object',
        properties: {
          isim: {
            type: 'string',
            description: 'Müşterinin adı ve soyadı',
          },
          telefon: {
            type: 'string',
            description: 'Müşterinin telefon numarası (Türkiye formatı: 05XX XXX XX XX)',
          },
          not: {
            type: 'string',
            description: 'Müşterinin isteği veya notlar',
          },
        },
        required: ['isim', 'telefon', 'not'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'bilgi_ver',
      description: 'İş/hizmet hakkında bilgi verir. Müşterinin sorusunu yanıtlar.',
      parameters: {
        type: 'object',
        properties: {
          konu: {
            type: 'string',
            description: 'Müşterinin sorduğu konu veya soru',
          },
        },
        required: ['konu'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'geri_donum_sozu',
      description: 'Müşteriye en kısa sürede geri dönüş yapılacağını kaydeder ve söyler.',
      parameters: {
        type: 'object',
        properties: {
          isim: {
            type: 'string',
            description: 'Müşterinin adı',
          },
          telefon: {
            type: 'string',
            description: 'Müşterinin telefon numarası',
          },
          konu: {
            type: 'string',
            description: 'Müşterinin sorunu veya isteği',
          },
        },
        required: ['isim', 'telefon', 'konu'],
      },
    },
  },
];

/**
 * Vapi Assistant System Message
 * Bu mesaj Vapi Dashboard'da assistant oluşturulurken kullanılacak
 */
export const VAPI_SYSTEM_MESSAGE = `
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
`.trim();

/**
 * Vapi Assistant First Message
 */
export const VAPI_FIRST_MESSAGE = `
Merhaba! Open Claw'a hoş geldiniz. Ben size nasıl yardımcı olabilirim?
Randevu almak, hizmetlerimiz hakkında bilgi almak veya bir konuda destek istemek için buradayım.
`.trim();
