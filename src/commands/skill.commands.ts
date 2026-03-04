/**
 * Skill Commands — /skills, /skill <name>
 */

import { Bot } from 'grammy';
import { skillManager } from '../skills';
import { safeReply } from '../utils/telegram.helpers';
// import { adminOnly } from '../telegram/auth'; // Removed

export function registerSkillCommands(bot: Bot): void {
  bot.command('skills', async (ctx) => {
    await safeReply(ctx, skillManager.formatSkillsList());
  });

  bot.command('skill', async (ctx) => {
    const name = ctx.message?.text
      ?.replace(/^\/skill\s*/i, '')
      .trim()
      .toLowerCase();
    if (!name) {
      await safeReply(ctx, '⚠️ Kullanım: `/skill <isim>` — skill aç/kapat');
      return;
    }
    const result = skillManager.toggle(name);
    if (result === null) {
      await ctx.reply(`❌ "${name}" adında skill bulunamadı. /skills ile listeye bak.`);
    } else {
      const emoji = result ? '🟢' : '🔴';
      const status = result ? 'açıldı' : 'kapatıldı';
      await safeReply(ctx, `${emoji} **${name}** skill'i ${status}!`);
    }
  });
}
