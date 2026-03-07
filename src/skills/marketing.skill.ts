import { Skill, SkillContext, SkillResult } from './skill-manager';
import { safeLog, safeError } from '../utils/logger';
import { chat } from '../llm/openrouter';

export const marketingSkill: Skill = {
  name: 'marketing',
  displayName: 'Pazarlama Uzmanı (BANU)',
  emoji: '📢',
  description: 'Reklam metinleri, pazarlama stratejileri ve vurucu kampanya fikirleri üretir.',
  triggers: ['reklam', 'kampanya', 'pazarlama', 'marketing'],
  enabled: true,
  execute: async (ctx: SkillContext): Promise<SkillResult> => {
    try {
      let query = ctx.userMessage;
      for (const trigger of marketingSkill.triggers) {
        if (query.toLowerCase().includes(trigger)) {
          query = query.replace(new RegExp(trigger, 'i'), '').trim();
          break;
        }
      }

      if (!query) {
        return {
          text: 'Nasıl bir kampanya veya reklam metni hazırlamamı istersiniz?',
          voiceText: 'Nasıl bir kampanya hazırlamamı istersiniz?',
        };
      }

      safeLog('Marketing Skill running', { query });

      const systemPrompt = `
Sen "Agent Claw" (Ajan Pençesi) ekibinin baş Reklamcı ve Pazarlama Uzmanısın.
Sert, kurnaz, yaratıcı ve çok profesyonel bir metin yazarısın. 
- Hedef kitlenin duygularına hitap etmeyi çok iyi bilirsin.
- Uzun ve sıkıcı cümleler kurmaz, doğrudan, etkileyici ve akılda kalıcı sloganlar üretirsin.
- Verdiğin çıktılar bir pazarlama kampanyasında doğrudan kopyalanıp kullanılabilecek kalitede olmalıdır.
- Türkçe yanıt ver.
      `.trim();

      // IMPORTANT: Explicitly bypass the system model and use minimax-2.5 for the marketing persona
      const response = await chat(query, [], systemPrompt, undefined, 'minimax/minimax-01-2.5-pro');

      return {
        text: `💡 **Pazarlama Stratejisi & Reklam Kopyası:**\n\n${response.content}`,
        voiceText: 'Reklam ve kampanya kurgunuz hazır. Ekranda okuyabilirsiniz.',
      };
    } catch (error: any) {
      safeError('Marketing Skill Error', error);
      return {
        text: `⚠️ Pazarlama stratejisi üretilirken bir hata oluştu: ${error.message}`,
        voiceText: 'Kampanya oluştururken bir hata ile karşılaştım.',
      };
    }
  },
};
