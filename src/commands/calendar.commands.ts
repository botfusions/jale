/**
 * Calendar Commands — /today, /calendar, /week, /todayoku
 */

import { Bot } from 'grammy';
import fs from 'fs';
import {
  getTodayEvents,
  getTomorrowEvents,
  getUpcomingEvents,
  formatCalendarSummary,
} from '../mcp/calendar';
import { safeError } from '../utils/logger';
// import { adminOnly } from '../telegram/auth'; // Removed

export function registerCalendarCommands(bot: Bot): void {
  bot.command('calendar', async (ctx) => {
    try {
      await ctx.api.sendChatAction(ctx.chat!.id, 'typing');
      const events = await getTomorrowEvents();
      const summary = formatCalendarSummary(events, '📅 Yarınki Takvim');
      await ctx.reply(summary, { parse_mode: 'Markdown' });
    } catch (error) {
      await ctx.reply('❌ Takvim bilgisi alınamadı.');
    }
  });

  bot.command('today', async (ctx) => {
    try {
      await ctx.api.sendChatAction(ctx.chat!.id, 'typing');
      const events = await getTodayEvents();
      const summary = formatCalendarSummary(events, '📅 Bugünkü Takvim');
      await ctx.reply(summary, { parse_mode: 'Markdown' });
    } catch (error) {
      await ctx.reply('❌ Takvim bilgisi alınamadı.');
    }
  });

  bot.command('week', async (ctx) => {
    try {
      await ctx.api.sendChatAction(ctx.chat!.id, 'typing');
      const events = await getUpcomingEvents(7);
      const summary = formatCalendarSummary(events, '📅 Bu Hafta');
      await ctx.reply(summary, { parse_mode: 'Markdown' });
    } catch (error) {
      await ctx.reply('❌ Takvim bilgisi alınamadı.');
    }
  });

  // Read today's calendar aloud
  bot.command('todayoku', async (ctx) => {
    try {
      await ctx.api.sendChatAction(ctx.chat!.id, 'typing');
      const events = await getTodayEvents();

      if (events.length === 0) {
        await ctx.reply('✨ Bugün takvimde etkinlik yok!');
        return;
      }

      // Build readable text
      const readableLines = events.map((e: any, i: number) => {
        const time = e.start
          ? new Date(e.start).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
          : '';
        return `${i + 1}. saat ${time}, ${e.summary}${e.location ? `, yer: ${e.location}` : ''}`;
      });
      const fullText = `Bugün ${events.length} etkinliğin var. ${readableLines.join('. ')}`;

      // Text first
      const summary = formatCalendarSummary(events, '📅 Bugünkü Takvim');
      await ctx.reply(summary, { parse_mode: 'Markdown' });

      // Voice
      await ctx.api.sendChatAction(ctx.chat!.id, 'record_voice');
      const { textToSpeech, cleanupTempFile } = await import('../tts/tts.service');
      const audioPath = await textToSpeech(fullText);

      if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 100) {
        await ctx.replyWithVoice(new (await import('grammy')).InputFile(audioPath));
      }
      cleanupTempFile(audioPath);
    } catch (error) {
      safeError('Calendar voice read failed', error);
      await ctx.reply('❌ Takvim sesli okunamadı.');
    }
  });
}
