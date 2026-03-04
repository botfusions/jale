import { Bot, Context } from 'grammy';
import { getEnv } from '../config/env';
import { safeLog } from '../utils/logger';
import { MESSAGES } from '../config/constants';

export function createBot(): Bot {
  const env = getEnv();
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  // Allowlist middleware — must be first
  bot.use(async (ctx: Context, next: () => Promise<void>) => {
    const userId = ctx.from?.id?.toString();
    const env = getEnv();
    const allowedUserIds = env.TELEGRAM_ALLOWLIST_USER_ID?.split(',') || [];

    if (!userId || !allowedUserIds.includes(userId)) {
      safeLog('Unauthorized access attempt', {
        userId: userId || 'unknown',
      });
      await ctx.reply(MESSAGES.UNAUTHORIZED);
      return;
    }

    await next();
  });

  return bot;
}

export async function downloadFile(bot: Bot, fileId: string, destPath: string): Promise<string> {
  const file = await bot.api.getFile(fileId);

  if (!file.file_path) {
    throw new Error('File path not available');
  }

  const env = getEnv();
  const url = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }

  const fs = await import('fs');
  const path = await import('path');

  // Ensure directory exists
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destPath, buffer);

  safeLog('File downloaded from Telegram', { fileId, size: buffer.length });

  return destPath;
}
