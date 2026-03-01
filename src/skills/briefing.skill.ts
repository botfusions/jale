import { Skill, SkillContext, SkillResult } from './skill-manager';
import { safeLog, safeError } from '../utils/logger';
import { weatherSkill } from './weather.skill';

export const briefingSkill: Skill = {
  name: 'briefing',
  displayName: 'Günlük Brifing',
  emoji: '📰',
  description: 'Sabah hava durumu, günün özeti ve hatırlatmaları sunar.',
  triggers: ['brifing', 'günün özeti', 'bugün ne var', 'sabah raporu'],
  enabled: true,
  execute: async (ctx: SkillContext): Promise<SkillResult> => {
    try {
      safeLog('Briefing Skill running');

      let briefingText = '🌅 **Günaydın! İşte Günlük Brifinginiz:**\n\n';
      let voiceText = 'Günaydın! İşte günlük brifinginiz. ';

      // 1. Weather fetching
      try {
        const fakeCtx = { ...ctx, userMessage: 'hava durumu istanbul' };
        const weatherResult = await weatherSkill.execute(fakeCtx);
        briefingText += '---\n📝 **Hava Durumu:**\n' + weatherResult.text + '\n';
        if (weatherResult.voiceText) {
          voiceText += weatherResult.voiceText + ' ';
        }
      } catch (err: any) {
        safeError('Briefing: Weather fetch failed', err);
      }

      // 2. Quote of the day using dummyjson as fallback robust API
      try {
        const quoteResponse = await fetch('https://dummyjson.com/quotes/random');
        if (quoteResponse.ok) {
          const quoteData: any = await quoteResponse.json();
          briefingText += `\n---\n💡 **Günün Sözü:**\n_"${quoteData.quote}"_\n— ${quoteData.author}\n`;
          voiceText += 'Günün sözü: ' + quoteData.quote + '. ';
        } else {
          briefingText += `\n---\n💡 **Günün Sözü:**\n_"Başlamak için mükemmel olmayı bekleme."_\n`;
        }
      } catch (err) {
        briefingText += `\n---\n💡 **Günün Sözü:**\n_"Başlamak için mükemmel olmayı bekleme."_\n`;
      }

      // 3. Calendar (Mocked for now)
      briefingText += `\n---\n📅 **Takvim:**\nBugün için planlanmış bir etkinlik bulunmuyor. Harika bir gün geçirin!`;
      voiceText += 'Bugün için planlanmış bir etkinliğiniz yok. Harika bir gün dilerim!';

      return {
        text: briefingText,
        voiceText: voiceText,
      };
    } catch (error: any) {
      safeError('Briefing Skill Error', error);
      return {
        text: `⚠️ Brifing hazırlanırken bir hata oluştu: ${error.message}`,
        voiceText: 'Günlük brifinginizi şu an hazırlayamıyorum.',
      };
    }
  },
};
