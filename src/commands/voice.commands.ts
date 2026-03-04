/**
 * Voice Commands — /voice
 */

import { Bot } from 'grammy';
import fs from 'fs';
import { safeError } from '../utils/logger';
import { safeReply } from '../utils/telegram.helpers';

export function registerVoiceCommands(bot: Bot): void {
  // Direct voice command: /voice <text>
  bot.command('voice', async (ctx) => {
    const text = ctx.message?.text?.replace(/^\/voice\s*/i, '').trim();
    if (!text) {
      await safeReply(ctx, '⚠️ Kullanım: `/voice Merhaba dünya`');
      return;
    }
    try {
      await ctx.api.sendChatAction(ctx.chat!.id, 'record_voice');
      const { textToSpeech, cleanupTempFile } = await import('../tts/tts.service');
      const audioPath = await textToSpeech(text);

      if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 100) {
        await ctx.replyWithVoice(new (await import('grammy')).InputFile(audioPath));
      } else {
        await ctx.reply('❌ Ses dosyası oluşturulamadı.');
      }
      cleanupTempFile(audioPath);
    } catch (error) {
      safeError('Voice command failed', error);
      await ctx.reply('❌ Sesli yanıt oluşturulamadı.');
    }
  });
}
