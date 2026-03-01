import { Skill, SkillContext, SkillResult } from './skill-manager';
import { safeLog, safeError } from '../utils/logger';

export const webSearchSkill: Skill = {
  name: 'web-search',
  displayName: 'Web Arama',
  emoji: '🔍',
  description: 'İnternette arama yapar ve özet bilgi sunar.',
  triggers: ['ara ', 'bul ', 'nedir', 'kimdir', 'search'],
  enabled: true,
  execute: async (ctx: SkillContext): Promise<SkillResult> => {
    try {
      // Extract the query from the user message
      let query = ctx.userMessage;
      for (const trigger of webSearchSkill.triggers) {
        if (query.toLowerCase().includes(trigger)) {
          // Remove the trigger to get the actual query
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

      safeLog('Web Search running', { query });

      // Search using DuckDuckGo Html version (simple and doesn't require API key)
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

      // Very simple parsing of the HTML to extract the first few results
      // This is a basic approach; a robust solution might parse with cheerio or use an actual API
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
        if (limit >= 3) break; // Limit to 3 results

        // Match group 1: href, group 2: title, group 3: snippet
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

          const title = m[2].replace(/<\/?[^>]+(>|$)/g, '').trim(); // Strip HTML from title
          const snippet = m[3].replace(/<\/?[^>]+(>|$)/g, '').trim(); // Strip HTML from snippet

          results.push(`**${title}**\n${snippet}\n[Kaynak](${href})`);
          limit++;
        }
      }

      if (results.length === 0) {
        return { text: `"${query}" hakkında sonuçları ayrıştıramadım.` };
      }

      const replyText = `🔍 **"${query}" İçin Arama Sonuçları:**\n\n` + results.join('\n\n');

      return {
        text: replyText,
        voiceText: `İnternette arama yaptım, birkaç sonuç buldum. Sonuçları ekranda görebilirsiniz.`,
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
