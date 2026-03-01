import { Skill, SkillContext, SkillResult } from './skill-manager';
import { safeLog, safeError } from '../utils/logger';
import { chat, LLMMessage } from '../llm/openrouter';

export const researcherSkill: Skill = {
  name: 'researcher',
  displayName: 'Araştırmacı Ajan',
  emoji: '🔬',
  description: 'Verilen bir konu hakkında derinlemesine analiz ve araştırma raporu sunar.',
  triggers: ['araştır', 'analiz et', 'derin araştırma', 'raporla'],
  enabled: true,
  execute: async (ctx: SkillContext): Promise<SkillResult> => {
    try {
      let query = ctx.userMessage;
      for (const trigger of researcherSkill.triggers) {
        if (query.toLowerCase().includes(trigger)) {
          query = query.replace(new RegExp(trigger, 'i'), '').trim();
          break;
        }
      }

      if (!query) {
        return {
          text: 'Hangi konuyu araştırmamı istersiniz? Lütfen detay belirtin.',
          voiceText: 'Hangi konuyu araştırmamı istersiniz?',
        };
      }

      safeLog('Researcher Skill running', { query });

      const systemPrompt = `
You are the Chief Researcher Agent of the Agent Swarm.
Your task is to provide a deep, well-structured, and comprehensive analysis of the requested topic.
- Break down the topic into logical sections (e.g., Overview, Key Points, Analysis, Conclusion).
- Be extremely factual and detail-oriented.
- Respond in Turkish.
      `.trim();

      const response = await chat(query, [], systemPrompt);

      return {
        text: `🔬 **Araştırma Raporu:**\n\n${response.content}`,
        voiceText: 'Araştırma raporunuz hazır. Ekranda okuyabilirsiniz.',
      };
    } catch (error: any) {
      safeError('Researcher Skill Error', error);
      return {
        text: `⚠️ Araştırma yapılırken bir hata oluştu: ${error.message}`,
        voiceText: 'Araştırma sırasında bir hata ile karşılaştım.',
      };
    }
  },
};
