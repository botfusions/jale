import { Skill, SkillContext, SkillResult } from './skill-manager';
import { BorsaciAgent } from '../agents/borsaci-agent';

export const borsaSkill: Skill = {
  name: 'borsa',
  displayName: 'Borsacı',
  emoji: '📈',
  description:
    'Borsa, hisse senetleri, piyasa analizleri ve kripto paralar hakkında güncel finansal özetler ve veri analizi sunar. KAYA (Borsacı Ajanı) görev alır.',
  triggers: [
    'borsa',
    'piyasa',
    'hisse',
    'kripto',
    'borsacı',
    'finans',
    'bist',
    'coin',
    'altın',
    'dolar',
    'euro',
    'fon',
    'tefas',
  ],
  enabled: true,
  execute: async (ctx: SkillContext): Promise<SkillResult> => {
    let query = ctx.userMessage;

    // Clean triggers from query
    for (const trigger of borsaSkill.triggers) {
      query = query.replace(new RegExp(trigger, 'gi'), '').trim();
    }

    if (!query || query.length < 2) {
      return {
        text: 'Lütfen incelemek istediğiniz hisse veya piyasayı belirtin. Örnek: "Borsa ASELS durumu nedir?"',
        voiceText: 'Analiz etmemi istediğiniz piyasa veya hisseyi belirtmediniz.',
      };
    }

    try {
      const agent = new BorsaciAgent();
      const response = await agent.analyzeMarket(query, []);

      return {
        text: response.content,
        voiceText: 'Borsa analizi KAYA tarafından tamamlandı. Sonuçlar ekranda.',
      };
    } catch (err: any) {
      return {
        text: `⚠️ Bir hata oluştu:\n\`\`\`\n${err.message}\n\`\`\``,
        voiceText: 'Analiz sırasında bir hata meydana geldi.',
      };
    }
  },
};
