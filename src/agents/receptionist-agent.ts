/**
 * Receptionist Agent
 *
 * Vapi telefon aramalarını karşılayan resepsiyon ajanı.
 * Randevu oluşturma, müşteri kaydı ve bilgi verme işlemlerini yönetir.
 */

import { storeMemory, recallMemories } from '../memory/vector.service';
import { appendMemoryLog } from '../memory/core.memory';
import { safeLog, safeError } from '../utils/logger';
import { CEOAgent } from './ceo-agent';

// Hizmet bilgileri
const SERVICES = {
  'yazılım geliştirme': {
    description: 'Web, mobil ve masaüstü uygulama geliştirme',
    details: [
      'React, Vue, Angular frontend',
      'Node.js, Python backend',
      'iOS/Android mobil',
      'Masaüstü uygulamaları',
    ],
  },
  'ai ml': {
    description: 'Yapay zeka ve makine öğrenmesi çözümleri',
    details: ['LLM entegrasyonları', 'Chatbot geliştirme', 'Sesli asistanlar', 'Otomasyon'],
  },
  otomasyon: {
    description: 'İş süreçleri otomasyonu',
    details: ['RPA çözümleri', 'Workflow otomasyonu', 'API entegrasyonları', 'Zapier/Make'],
  },
  danışmanlık: {
    description: 'Teknoloji danışmanlığı',
    details: ['Dijital dönüşüm', 'Sistem mimarisi', 'Proje yönetimi', 'Ekip eğitimi'],
  },
};

export class ReceptionistAgent {
  private name: string = 'LEYA_RESEPSİYON';
  private ceoAgent: CEOAgent;

  constructor() {
    this.ceoAgent = new CEOAgent();
  }

  /**
   * Randevu oluştur ve CEO'ya bildir
   */
  async createAppointment(
    isim: string,
    telefon: string,
    tarih: string,
    saat: string,
    not?: string
  ): Promise<string> {
    try {
      safeLog('Creating appointment', { isim, telefon, tarih, saat });

      const memoryText = `RANDEVU TALEBİ: ${isim} - Tel: ${telefon} - Tarih: ${tarih} Saat: ${saat} ${not ? `- Not: ${not}` : ''}`;
      await storeMemory(memoryText, 'vapi-receptionist', 'appointment');
      appendMemoryLog(`[RANDEVU] ${isim} | ${telefon} | ${tarih} ${saat}`);

      // JALE'yi bilgilendir (Ajanlar arası raporlama)
      const report = `Jale Hanım, ben Resepsiyonist Leya. Yeni bir randevu talebi aldım. Müşteri: ${isim}, Tarih: ${tarih} ${saat}. Bilgilerinize sunarım.`;
      await this.ceoAgent.processRequest(report, 'vapi-receptionist');

      return `Randevunuz başarıyla oluşturuldu! Sayın ${isim}, ${tarih} tarihinde saat ${saat}'te sizi bekliyoruz. CEO'muz Jale hanım da konuyla bizzat ilgileniyor.`;
    } catch (error: any) {
      safeError('Failed to create appointment', error);
      return `Randevu oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar arayın.`;
    }
  }

  /**
   * Müşteri kaydı oluştur ve CEO'ya bildir
   */
  async saveCustomer(isim: string, telefon: string, not: string, callId?: string): Promise<string> {
    try {
      safeLog('Saving customer', { isim, telefon, callId });

      const memoryText = `MÜŞTERİ: ${isim} - Tel: ${telefon} - İstek: ${not}`;
      await storeMemory(memoryText, 'vapi-receptionist', 'customer');
      appendMemoryLog(`[MÜŞTERİ] ${isim} | ${telefon}`);

      // JALE'yi bilgilendir
      const report = `Jale Hanım, ben Leya. Beni arayan bir müşterimizin kaydını aldım: ${isim} (${telefon}). Talebi: ${not}. Bilgilerinize sunarım.`;
      await this.ceoAgent.processRequest(report, 'vapi-receptionist');

      return `Bilgileriniz kaydedildi ${isim} bey/hanım. En kısa sürede size dönüş yapılacaktır. Telefon numaranız: ${telefon}`;
    } catch (error: any) {
      safeError('Failed to save customer', error);
      return `Bilgiler kaydedilirken bir hata oluştu.`;
    }
  }

  /**
   * Hizmet bilgisi ver
   */
  async getInfo(konu: string): Promise<string> {
    try {
      safeLog('Getting info', { konu });
      const lowerKonu = konu.toLowerCase();

      for (const [key, value] of Object.entries(SERVICES)) {
        if (lowerKonu.includes(key) || key.includes(lowerKonu.substring(0, 5))) {
          return `${value.description}. Kapsamımız: ${value.details.join(', ')}. Daha fazla bilgi ister misiniz?`;
        }
      }

      // Bilinmeyen veya stratejik konu ise JALE'ye (Yönetici Asistanı) sor
      safeLog('Consulting Jale for expertise', { konu });
      const jaleResponse = await this.ceoAgent.processRequest(
        `Jale Hanım, bir müşterimiz şu konuyu soruyor, ne cevap vermeliyim? Konu: ${konu}`,
        'vapi-receptionist'
      );

      if (jaleResponse && jaleResponse.content) {
        return jaleResponse.content;
      }

      return `Bu konu hakkında size en kısa sürede detaylı bilgi verilecektir. İletişim bilgilerinizi alabilir miyim?`;
    } catch (error: any) {
      safeError('Failed to get info', error);
      return `Şu an bilgi veremiyorum. Daha sonra tekrar deneyin.`;
    }
  }

  /**
   * Geri dönüş sözü ver
   */
  async promiseCallback(isim: string, telefon: string, konu: string): Promise<string> {
    try {
      safeLog('Creating callback promise', { isim, telefon, konu });
      const memoryText = `GERİ DÖNÜŞ: ${isim} - Tel: ${telefon} - Konu: ${konu}`;
      await storeMemory(memoryText, 'vapi-receptionist', 'callback');
      appendMemoryLog(`[GERİ DÖNÜŞ] ${isim} | ${telefon}`);

      return `Sayın ${isim}, "${konu}" konusundaki talebiniz kaydedildi. En kısa sürede size dönüş yapılacaktır.`;
    } catch (error: any) {
      safeError('Failed to create callback', error);
      return `Talebiniz kaydedildi. Dönüş yapacağız.`;
    }
  }

  /**
   * Telefon konuşmasını hafızaya kaydet
   */
  async saveTranscript(transcript: string, callId?: string): Promise<void> {
    try {
      const memoryText = `TELEFON GÖRÜŞMESİ [ID: ${callId || 'N/A'}]: ${transcript}`;
      await storeMemory(memoryText, 'vapi-transcript', 'call_record');
      appendMemoryLog(`[VAPI-TRANSCRIPT] ${transcript.substring(0, 50)}...`);
    } catch (error: any) {
      safeError('Failed to save transcript', error);
    }
  }
}
