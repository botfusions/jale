import { Skill, SkillContext, SkillResult } from './skill-manager';
import { safeLog, safeError } from '../utils/logger';
import { MODELS } from '../config/constants';
import { chat } from '../llm/openrouter';
import { searchBrave, BraveSearchResult } from '../utils/brave-search';
import { scrapeWithScrapling } from '../utils/scraper';

export const researcherSkill: Skill = {
  name: 'researcher',
  displayName: 'Araştırmacı (AYÇA)',
  emoji: '🔍',
  description: 'Verilen bir konu hakkında internette derinlemesine araştırma yapar ve rapor sunar.',
  triggers: ['araştır', 'analiz et', 'derin araştırma', 'raporla', 'incele'],
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

      safeLog('Ayça (Researcher) starting research', { query });

      // Detect if query is JUST a URL
      const urlRegex = /^(https?:\/\/[^\s]+)$/i;
      const isDirectUrl = urlRegex.test(query);

      if (isDirectUrl) {
        safeLog('Ayça detected a direct URL, using summarize utility');
        const { summarizeContent } = await import('../utils/summarize');
        const summary = await summarizeContent(query, { model: MODELS.FLASH });

        return {
          text: `🔬 **Ayça'nın Hızlı Özet Raporu:**\n\n${summary}`,
          voiceText: 'Verdiğiniz bağlantıyı saniyeler içinde analiz edip özetledim.',
        };
      }

      // Step 1: Search for information
      const searchResults = await searchBrave(query);
      let context = '';

      if (searchResults.length > 0) {
        safeLog('Ayça found search results, preparing to scrape and summarize top links');

        // Step 2: Use summarize on the top result for high-quality context
        const topLink = searchResults[0].url;
        try {
          const { summarizeContent } = await import('../utils/summarize');
          const summary = await summarizeContent(topLink, {
            length: 'medium',
            model: MODELS.FLASH,
          });
          context = `--- ANA KAYNAK ÖZETİ (${topLink}) ---\n${summary}\n\n`;
        } catch (e) {
          safeError('Summarize failed for top link, falling back to basic scrape', e);
          const scraped = await scrapeWithScrapling(topLink);
          if (scraped.status === 'success') {
            context = `--- KAYNAK: ${scraped.title} (${scraped.url}) ---\n${scraped.content}\n`;
          }
        }
      }

      // Step 3: Synthesis with LLM
      const systemPrompt = `
You are AYÇA, the Chief Researcher Agent of the Jale AI Swarm.
Your task is to provide a deep, well-structured, and comprehensive analysis based on the provided web context and your own knowledge.

CONTEXT FROM WEB SEARCH & SCRAPING:
${context || 'No direct web context available, use your internal knowledge base.'}

INSTRUCTIONS:
- Break down the analysis into logical sections (Overview, Key Findings, Details, Conclusion).
- Always cite the sources if provided in context.
- Be extremely factual, professional, and detail-oriented.
- Respond in Turkish.
      `.trim();

      const response = await chat(
        `Konu: ${query}\n\nLütfen bu konuyu derinlemesine analiz et.`,
        [],
        systemPrompt,
        [],
        MODELS.FLASH
      );

      return {
        text: `🔬 **Ayça'nın Araştırma Raporu:**\n\n${response.content}`,
        voiceText: 'Araştırma raporunuzu internetteki en güncel verilere dayanarak hazırladım.',
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
