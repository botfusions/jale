import { Skill, SkillContext, SkillResult } from './skill-manager';
import { safeLog, safeError } from '../utils/logger';
import { storeMemory, storeImageMemory, recallMemories } from '../memory/vector.service';

export const memorySkill: Skill = {
  name: 'memory',
  displayName: 'Hafıza Uzmanı (MEHMET)',
  emoji: '🧠',
  description: 'Bilgileri ve resimleri uzun süreli hafızaya kaydeder veya hatırlar.',
  triggers: ['hatırla', 'kaydet', 'hafızaya al', 'bu resmi hatırla', 'ne demiştik', 'kimdi', 'bul'],
  enabled: true,
  execute: async (ctx: SkillContext): Promise<SkillResult> => {
    try {
      const { userMessage, userId } = ctx;
      
      // Resim hatırlama kontrolü
      if (userMessage.toLowerCase().includes('resim') && ctx.data?.imageUrl) {
        const memoryId = await storeImageMemory(ctx.data.imageUrl, userId);
        return {
          text: `🧠 **Hafıza Güncellendi:** Bu resmi analiz ettim ve Qdrant hafızama kaydettim. İleride sorduğunda hatırlayacağım. (ID: ${memoryId})`,
          voiceText: 'Resmi hafızama aldım.',
        };
      }

      // Bilgi kaydetme kontrolü ("... kaydet", "... hafızaya al")
      if (userMessage.toLowerCase().includes('kaydet') || userMessage.toLowerCase().includes('hafızaya al')) {
        const cleanText = userMessage
          .replace(/kaydet/gi, '')
          .replace(/hafızaya al/gi, '')
          .replace(/lütfen/gi, '')
          .trim();
        
        if (cleanText.length > 5) {
          const memoryId = await storeMemory(cleanText, userId);
          return {
            text: `🧠 **Bilgi Kaydedildi:** "${cleanText}" bilgisini Qdrant hafızama işledim. (ID: ${memoryId})`,
            voiceText: 'Bilgiyi hafızama kaydettim.',
          };
        }
      }

      // Bilgi hatırlama/sorgulama
      const memories = await recallMemories(userMessage, userId, 3);
      if (memories.length > 0) {
        const memoryText = memories.map(m => `• ${m.text}`).join('\n');
        return {
          text: `🧠 **MEHMET Hatırlıyor:**\n\n${memoryText}`,
          voiceText: 'İlgili bilgileri hatırladım.',
        };
      }

      return {
        text: '🧠 Hafızamda bu konuyla ilgili spesifik bir kayıt bulamadım ama öğrenmeye devam ediyorum.',
        voiceText: 'Bunu henüz hatırlayamadım.',
      };
    } catch (error: any) {
      safeError('Memory Skill Error', error);
      return {
        text: '⚠️ Hafıza modülünde bir sorun oluştu.',
        voiceText: 'Hafızama erişirken hata aldım.',
      };
    }
  },
};
