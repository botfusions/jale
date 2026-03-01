/**
 * Skill Commands — /skills, /skill <name>
 */

import { Bot } from 'grammy';
import { skillManager } from '../skills';

export function registerSkillCommands(bot: Bot): void {
  bot.command('skills', async (ctx) => {
    await ctx.reply(skillManager.formatSkillsList(), { parse_mode: 'Markdown' });
  });

  bot.command('skill', async (ctx) => {
    const name = ctx.message?.text
      ?.replace(/^\/skill\s*/i, '')
      .trim()
      .toLowerCase();
    if (!name) {
      await ctx.reply('⚠️ Kullanım: `/skill <isim>` — skill aç/kapat', { parse_mode: 'Markdown' });
      return;
    }
    const result = skillManager.toggle(name);
    if (result === null) {
      await ctx.reply(`❌ "${name}" adında skill bulunamadı. /skills ile listeye bak.`);
    } else {
      const emoji = result ? '🟢' : '🔴';
      const status = result ? 'açıldı' : 'kapatıldı';
      await ctx.reply(`${emoji} **${name}** skill'i ${status}!`, { parse_mode: 'Markdown' });
    }
  });
}
