/**
 * Receptionist Agent
 *
 * Vapi telefon aramalarını karşılayan resepsiyon ajanı.
 * Randevu oluşturma, müşteri kaydı ve bilgi verme işlemlerini yönetir.
 *
 * Görevler:
 * - İş/hizmet bilgisi ver
 * - Randevu oluştur
 * - Müşteri bilgilerini kaydet
 * - Geri dönüş sözü ver
 * - Konu dışı sorulara cevap VERME
 */

import { storeMemory, recallMemories } from '../memory/vector.service';
import { appendMemoryLog } from '../memory/core.memory';
import { safeLog, safeError } from '../utils/logger';

// Hizmet bilgileri
const SERVICES = {
  'yazılım geliştirme': {
    description: 'Web, mobil ve masaüstü uygulama geliştirme',
    details: ['React, Vue, Angular frontend', 'Node.js, Python backend', 'iOS/Android mobil', 'Masaüstü uygulamaları'],
  },
  'ai ml': {
    description: 'Yapay zeka ve makine öğrenmesi çözümleri',
    details: ['LLM entegrasyonları', 'Chatbot geliştirme', 'Sesli asistanlar', 'Otomasyon'],
  },
  'otomasyon': {
    description: 'İş süreçleri otomasyonu',
    details: ['RPA çözümleri', 'Workflow otomasyonu', 'API entegrasyonları', 'Zapier/Make'],
  },
  'danışmanlık': {
    description: 'Teknoloji danışmanlığı',
    details: ['Dijital dönüşüm', 'Sistem mimarisi', 'Proje yönetimi', 'Ekip eğitimi'],
  },
};

export class ReceptionistAgent {
  private name: string = 'RESEPSİYON';

  /**
   * Randevu oluştur
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

      // Vector DB'ye kaydet
      const appointmentData = {
        type: 'randevu',
        isim,
        telefon,
        tarih,
        saat,
        not: not || '',
        durum: 'bekliyor',
        olusturma_tarihi: new Date().toISOString(),
      };

      const memoryText = `RANDEVU: ${isim} - Tel: ${telefon} - Tarih: ${tarih} Saat: ${saat} ${not ? `- Not: ${not}` : ''}`;
      const id = await storeMemory(memoryText, 'vapi-receptionist', 'appointment');

      appendMemoryLog(`[RANDEVU] ${isim} | ${telefon} | ${tarih} ${saat}`);

      safeLog('Appointment created', { id });

      return `Randevunuz başarıyla oluşturuldu! Sayın ${isim}, ${tarih} tarihinde saat ${saat}'te sizi bekliyoruz. En kısa sürede size dönüş yapılacaktır.`;
    } catch (error: any) {
      safeError('Failed to create appointment', error);
      return `Randevu oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar arayın.`;
    }
  }

  /**
   * Müşteri kaydı oluştur
   */
  async saveCustomer(isim: string, telefon: string, not: string, callId?: string): Promise<string> {
    try {
      safeLog('Saving customer', { isim, telefon, callId });

      // Vector DB'ye kaydet
      const memoryText = `MÜŞTERİ: ${isim} - Tel: ${telefon} - İstek: ${not} - Arama ID: ${callId || 'N/A'}`;
      const id = await storeMemory(memoryText, 'vapi-receptionist', 'customer');

      appendMemoryLog(`[MÜŞTERİ] ${isim} | ${telefon} | ${not}`);

      safeLog('Customer saved', { id });

      return `Bilgileriniz kaydedildi ${isim} bey/hanım. En kısa sürede size dönüş yapılacaktır. Telefon numaranız: ${telefon}`;
    } catch (error: any) {
      safeError('Failed to save customer', error);
      return `Bilgiler kaydedilirken bir hata oluştu. Lütfen daha sonra tekrar arayın.`;
    }
  }

  /**
   * Hizmet bilgisi ver
   */
  async getInfo(konu: string): Promise<string> {
    try {
      safeLog('Getting info', { konu });

      // Konuyu küçük harfe çevir ve anahtar kelimeleri ara
      const lowerKonu = konu.toLowerCase();

      // Hizmetlerden eşleşme ara
      for (const [key, value] of Object.entries(SERVICES)) {
        if (lowerKonu.includes(key) || key.includes(lowerKonu.substring(0, 5))) {
          return `${value.description}. Kapsamımız: ${value.details.join(', ')}. Daha fazla bilgi ister misiniz?`;
        }
      }

      // Genel hizmet bilgisi
      if (lowerKonu.includes('hizmet') || lowerKonu.includes('ne yapıyor') || lowerKonu.includes('iş')) {
        return `Open Claw olarak yazılım geliştirme, AI/ML çözümleri, otomasyon sistemleri ve teknoloji danışmanlığı sunuyoruz. Hangi konuda bilgi almak istersiniz?`;
      }

      // Fiyat bilgisi
      if (lowerKonu.includes('fiyat') || lowerKonu.includes('ücret') || lowerKonu.includes('maliyet')) {
        return `Fiyatlandırma projenin kapsamına göre değişmektedir. Detaylı bilgi için size özel bir teklif hazırlayabiliriz. İletişim bilgilerinizi alabilir miyim?`;
      }

      // Çalışma saatleri
      if (lowerKonu.includes('saat') || lowerKonu.includes('açık') || lowerKonu.includes('çalış')) {
        return `Hafta içi 09:00-18:00 arasında hizmet vermekteyiz. Acil durumlar için 7/24 destek mevcuttur.`;
      }

      // Konu dışı kontrolü
      const offTopicKeywords = [
        'hava', 'spor', 'siyaset', 'müzik', 'film', 'yemek', 'tarif',
        'astroloji', 'burç', 'fal', 'şaka', 'oyun', 'geyik'
      ];

      if (offTopicKeywords.some(kw => lowerKonu.includes(kw))) {
        return `Bu konuda yardımcı olamam. Sadece işimiz ve hizmetlerimiz hakkında bilgi verebilirim. Başka bir sorunuz var mı?`;
      }

      // Bilinmeyen konu - geri dönüş sözü
      return `Bu konu hakkında size en kısa sürede detaylı bilgi verilecektir. İletişim bilgilerinizi alabilir miyim?`;
    } catch (error: any) {
      safeError('Failed to get info', error);
      return `Şu an bilgi veremiyorum. En kısa sürede size dönüş yapılacaktır.`;
    }
  }

  /**
   * Geri dönüş sözü ver
   */
  async promiseCallback(isim: string, telefon: string, konu: string): Promise<string> {
    try {
      safeLog('Creating callback promise', { isim, telefon, konu });

      // Vector DB'ye kaydet
      const memoryText = `GERİ DÖNÜŞ: ${isim} - Tel: ${telefon} - Konu: ${konu} - Öncelik: Normal`;
      const id = await storeMemory(memoryText, 'vapi-receptionist', 'callback');

      appendMemoryLog(`[GERİ DÖNÜŞ] ${isim} | ${telefon} | ${konu}`);

      safeLog('Callback promise created', { id });

      return `Sayın ${isim}, "${konu}" konusundaki talebiniz kaydedildi. En kısa sürede size ${telefon} numarasından dönüş yapılacaktır. Bizi aradığınız için teşekkür ederiz!`;
    } catch (error: any) {
      safeError('Failed to create callback promise', error);
      return `Talebiniz kaydedildi. En kısa sürede size dönüş yapılacaktır.`;
    }
  }

  /**
   * Son müşterileri getir
   */
  async getRecentCustomers(limit: number = 10): Promise<string[]> {
    try {
      const memories = await recallMemories('MÜŞTERİ:', limit);
      return memories.map(m => m.text);
    } catch (error: any) {
      safeError('Failed to get recent customers', error);
      return [];
    }
  }

  /**
   * Son randevuları getir
   */
  async getRecentAppointments(limit: number = 10): Promise<string[]> {
    try {
      const memories = await recallMemories('RANDEVU:', limit);
      return memories.map(m => m.text);
    } catch (error: any) {
      safeError('Failed to get recent appointments', error);
      return [];
    }
  }
}
