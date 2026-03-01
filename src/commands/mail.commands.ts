/**
 * Mail Commands — /mail, /mailoku
 */

import { Bot } from 'grammy';
import fs from 'fs';
import { getUnreadEmails, formatEmailSummary } from '../mcp/gmail';
import { safeError } from '../utils/logger';

export function registerMailCommands(bot: Bot): void {
  // Gmail command (via gogcli — READ-ONLY)
  bot.command('mail', async (ctx) => {
    try {
      await ctx.api.sendChatAction(ctx.chat!.id, 'typing');
      const emails = await getUnreadEmails(5);
      const summary = formatEmailSummary(emails, '📧 Okunmamış E-postalar');
      await ctx.reply(summary, { parse_mode: 'Markdown' });
    } catch (error) {
      await ctx.reply('❌ E-posta bilgisi alınamadı.');
    }
  });

  // Read emails aloud via TTS
  bot.command('mailoku', async (ctx) => {
    try {
      await ctx.api.sendChatAction(ctx.chat!.id, 'typing');
      const emails = await getUnreadEmails(3);

      if (emails.length === 0) {
        await ctx.reply('✨ Okunmamış e-posta yok!');
        return;
      }

      // Build readable text for TTS
      const readableLines = emails.map(
        (e: any, i: number) =>
          `${i + 1}. e-posta. Gönderen: ${e.from || 'bilinmeyen'}. Konu: ${e.subject}. ${e.snippet ? e.snippet.substring(0, 120) : ''}`
      );
      const fullText = `${emails.length} okunmamış e-postan var. ${readableLines.join('. ')}`;

      // Send text version first
      const summary = formatEmailSummary(emails, '📧 Okunmamış E-postalar');
      await ctx.reply(summary, { parse_mode: 'Markdown' });

      // Then read aloud
      await ctx.api.sendChatAction(ctx.chat!.id, 'record_voice');
      const { textToSpeech, cleanupTempFile } = await import('../tts/tts.service');
      const audioPath = await textToSpeech(fullText);

      if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 100) {
        await ctx.replyWithVoice(new (await import('grammy')).InputFile(audioPath));
      }
      cleanupTempFile(audioPath);
    } catch (error) {
      safeError('Mail voice read failed', error);
      await ctx.reply('❌ E-posta sesli okunamadı.');
    }
  });
}
