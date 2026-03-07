import { Skill, SkillContext, SkillResult } from './skill-manager';
import { safeLog, safeError } from '../utils/logger';

export const translatorSkill: Skill = {
  name: 'translator',
  displayName: 'Tercüman (VOLKAN)',
  emoji: '🌍',
  description: "Metinleri anında İngilizce veya Türkçe'ye çevirir.",
  triggers: ['çevir', 'translate', 'ingilizceye çevir', 'türkçeye çevir', 'ingilizce', 'türkçe'],
  enabled: true,
  execute: async (ctx: SkillContext): Promise<SkillResult> => {
    try {
      let query = ctx.userMessage;
      let targetLang = 'en'; // default target
      let sourceLang = 'tr'; // default source

      if (query.toLowerCase().includes('türkçe') || query.toLowerCase().includes('to turkish')) {
        targetLang = 'tr';
        sourceLang = 'en';
      } else if (
        query.toLowerCase().includes('ingilizce') ||
        query.toLowerCase().includes('to english')
      ) {
        targetLang = 'en';
        sourceLang = 'tr';
      }

      // Clean the query from triggers
      for (const trigger of translatorSkill.triggers) {
        query = query.replace(new RegExp(trigger, 'gi'), '').trim();
      }

      // Clean target directions from the string
      query = query.replace(/ye|ya|'ye|'ya/gi, '').trim();

      if (!query || query.length < 2) {
        return {
          text: 'Lütfen çevirmek istediğiniz metni yazın. Örnek: "Güneşli kelimesini İngilizceye çevir"',
          voiceText: 'Çevirmemi istediğiniz metni belirtmediniz.',
        };
      }

      safeLog('Translator Skill running', { query, sourceLang, targetLang });

      // Using MyMemory free translation API
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=${sourceLang}|${targetLang}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Çeviri API yanıt vermedi: ${response.status}`);
      }

      const data: any = await response.json();

      if (data.responseStatus !== 200) {
        throw new Error(`Çeviri hatası: ${data.responseDetails}`);
      }

      const translatedText = data.responseData.translatedText;

      return {
        text: `🌐 **Çeviri Sonucu:**\n\n${translatedText}`,
        voiceText: `Çevirisi şöyle: ${translatedText}`,
      };
    } catch (error: any) {
      safeError('Translator Skill Error', error);
      return {
        text: `⚠️ Çeviri yapılırken bir hata oluştu: ${error.message}`,
        voiceText: 'Çeviri işlemini şu an gerçekleştiremiyorum.',
      };
    }
  },
};
