/**
 * Tool Commands — /ozet, /doctor, /heartbeat_test
 */

import { Bot } from 'grammy';
import fs from 'fs';
import path from 'path';
import { safeLog, safeError } from '../utils/logger';
import { COMMANDS } from '../config/constants';
import { runDiagnostics, formatDiagnostics } from '../doctor/doctor';
import { sendHeartbeatNow } from '../scheduler/heartbeat';
// import { adminOnly } from '../telegram/auth'; // Removed

export function registerToolCommands(bot: Bot): void {
  // Summarize command: /ozet <url>
  bot.command('ozet', async (ctx) => {
    const url = ctx.message?.text?.replace(/^\/ozet\s*/i, '').trim();
    if (!url) {
      await ctx.reply('⚠️ Kullanım: `/ozet https://example.com`', { parse_mode: 'Markdown' });
      return;
    }
    try {
      await ctx.reply('🔍 Sayfa okunuyor ve özetleniyor...');
      await ctx.api.sendChatAction(ctx.chat!.id, 'typing');

      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const execFileAsync = promisify(execFile);

      const localPath = path.resolve(process.cwd(), 'summarize/dist/cli.js');
      const useLocal = fs.existsSync(localPath);

      const cmd = useLocal ? 'node' : 'npx';
      const args = useLocal
        ? [localPath, url, '--plain', '--length', 'medium', '--lang', 'tr', '--timeout', '60s']
        : [
            '-y',
            '@steipete/summarize',
            url,
            '--plain',
            '--length',
            'medium',
            '--lang',
            'tr',
            '--timeout',
            '60s',
          ];

      const { stdout } = await execFileAsync(cmd, args, {
        timeout: 90000,
        maxBuffer: 1024 * 1024,
        shell: true,
      });

      const summary = stdout.trim();
      if (summary) {
        // Save as .md file
        const summariesDir = path.resolve(process.cwd(), 'summaries');
        if (!fs.existsSync(summariesDir)) fs.mkdirSync(summariesDir, { recursive: true });

        const safeName = url.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        const fileName = `${new Date().toISOString().split('T')[0]}_${safeName}.md`;
        const filePath = path.join(summariesDir, fileName);

        const fileContent = `# Özet: ${url}\n\nTarih: ${new Date().toLocaleString('tr-TR')}\n\n---\n\n${summary}`;
        fs.writeFileSync(filePath, fileContent, 'utf8');
        safeLog('Summary saved to file', { path: filePath });

        // Send to Telegram
        const chunks = summary.match(/[\s\S]{1,4000}/g) || [summary];
        for (const chunk of chunks) {
          await ctx.reply(chunk);
        }
        await ctx.reply(`📁 Özet kaydedildi: \`summaries/${fileName}\` ve hafızaya alındı.`, {
          parse_mode: 'Markdown',
        });
      } else {
        await ctx.reply('⚠️ Sayfa özetlenemedi — içerik bulunamadı.');
      }
    } catch (error: any) {
      safeError('Summarize failed', error);
      await ctx.reply("❌ Özetleme başarısız oldu. URL'yi kontrol edin.");
    }
  });

  // Doctor command
  bot.command(COMMANDS.DOCTOR, async (ctx) => {
    try {
      await ctx.reply('🩺 Doktor sistemi başlatılıyor, lütfen bekleyin...');
      await ctx.api.sendChatAction(ctx.chat!.id, 'typing');
      const diagnostics = await runDiagnostics();
      const report = formatDiagnostics(diagnostics);
      await ctx.reply(report, { parse_mode: 'Markdown' });
    } catch (error: any) {
      safeError('Doctor failed', error);
      await ctx.reply('❌ Doktor sistemi çalışırken bir hata oluştu.');
    }
  });

  // Heartbeat test command
  bot.command(COMMANDS.HEARTBEAT_TEST, async (ctx) => {
    try {
      await sendHeartbeatNow(bot);
      await ctx.reply('💓 Heartbeat test mesajı gönderildi!');
    } catch (error) {
      await ctx.reply('❌ Heartbeat test başarısız oldu.');
    }
  });
}
