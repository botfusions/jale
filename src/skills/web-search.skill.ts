import { Skill, SkillContext, SkillResult } from './skill-manager';
import { safeLog, safeError } from '../utils/logger';
import { searchBrave } from '../utils/brave-search';

export const webSearchSkill: Skill = {
  name: 'web-search',
  displayName: 'Web Arama (BRAVE)',
  emoji: '🔍',
  description: 'İnternette profesyonel arama yapar ve özet bilgi sunar.',
  triggers: ['ara ', 'bul ', 'nedir', 'kimdir', 'search'],
  enabled: true,
  execute: async (ctx: SkillContext): Promise<SkillResult> => {
    try {
      let query = ctx.userMessage;
      for (const trigger of webSearchSkill.triggers) {
        if (query.toLowerCase().includes(trigger)) {
          query = query.replace(new RegExp(trigger, 'i'), '').trim();
          break;
        }
      }

      if (!query) {
        return {
          text: 'Ne aramamı istersiniz? Lütfen aramak istediğiniz kelimeyi belirtin.',
          voiceText: 'Ne aramamı istersiniz?',
        };
      }

      safeLog('Web Search running (Brave Priority)', { query });

      // Try Brave Search first
      const braveResults = await searchBrave(query);

      if (braveResults.length > 0) {
        const results = braveResults
          .slice(0, 3)
          .map((r) => `**${r.title}**\n${r.description}\n[Kaynak](${r.url})`);

        return {
          text: `🔍 **Brave ile "${query}" İçin Arama Sonuçları:**\n\n` + results.join('\n\n'),
          voiceText: `Brave üzerinden arama yaptım, birkaç güncel sonuç buldum.`,
        };
      }

      // Fallback to DuckDuckGo if Brave yields no results or no API key
      safeLog('Falling back to DuckDuckGo for search');
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Arama gerçekleştirilemedi: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      const resultMatches = html.match(
        /<a class="result__url" href="([^"]+)".*?>(.*?)<\/a>.*?<a class="result__snippet[^>]+>(.*?)<\/a>/gis
      );

      if (!resultMatches || resultMatches.length === 0) {
        return {
          text: `"${query}" için bir sonuç bulamadım.`,
          voiceText: 'Arama için bir sonuç bulamadım.',
        };
      }

      const results: string[] = [];
      let limit = 0;
      for (const match of resultMatches) {
        if (limit >= 3) break;
        const m =
          /<a class="result__url" href="([^"]+)".*?>(.*?)<\/a>.*?<a class="result__snippet[^>]+>(.*?)<\/a>/is.exec(
            match
          );
        if (m && m.length === 4) {
          let href = m[1].trim();
          if (href.startsWith('//')) {
            const parsedUrl = new URL(href, 'https://html.duckduckgo.com');
            const rawUddg = parsedUrl.searchParams.get('uddg');
            href = rawUddg ? decodeURIComponent(rawUddg) : href;
          }
          const title = m[2].replace(/<\/?[^>]+(>|$)/g, '').trim();
          const snippet = m[3].replace(/<\/?[^>]+(>|$)/g, '').trim();
          results.push(`**${title}**\n${snippet}\n[Kaynak](${href})`);
          limit++;
        }
      }

      return {
        text: `🔍 **"${query}" İçin Arama Sonuçları:**\n\n` + results.join('\n\n'),
        voiceText: `İnternette arama yaptım, birkaç sonuç buldum.`,
      };
    } catch (error: any) {
      safeError('Web Search Skill Error', error);
      return {
        text: `⚠️ Arama yaparken bir hata oluştu: ${error.message}`,
        voiceText: 'Arama sırasında bir hata ile karşılaştım.',
      };
    }
  },
};
