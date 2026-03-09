import cron, { ScheduledTask } from 'node-cron';
import { Bot } from 'grammy';
import { getEnv } from '../config/env';
import { safeLog } from '../utils/logger';
import { APP_EMOJI, APP_NAME } from '../config/constants';
import { BorsaciAgent } from '../agents/borsaci-agent';
import { weatherSkill } from '../skills/weather.skill';

const borsaciAgent = new BorsaciAgent();

let scheduledTask: ScheduledTask | null = null;

const HEARTBEAT_MESSAGE = [
  `${APP_EMOJI} **Günaydın! Günlük Check-in**`,
  '',
  '1️⃣ Bugün **#1 önceliğin** ne?',
  '2️⃣ Kaldırmamı istediğin bir **engel** var mı?',
  '',
  '_Harika bir gün olsun!_ 🚀',
].join('\n');

export function startHeartbeat(bot: Bot): void {
  const env = getEnv();

  if (!env.HEARTBEAT_ENABLED) {
    safeLog('Heartbeat is disabled');
    return;
  }

  const cronExpression = env.HEARTBEAT_CRON;

  scheduledTask = cron.schedule(
    cronExpression,
    async () => {
      safeLog('Starting Daily Briefing execution');
      try {
        const userIds = env.TELEGRAM_ALLOWLIST_USER_ID.split(',').map((id) => id.trim());

        // 1. Fetch Market Summary (KAYA)
        let marketSummary = 'Piyasa bilgisi şu an alınamadı.';
        try {
          const kayaRes = await borsaciAgent.analyzeMarket(
            'Piyasa özeti geç ve günün öne çıkan finansal haberlerini listele.'
          );
          marketSummary = kayaRes.content;
        } catch (err) {
          safeLog('Heartbeat: KAYA summary failed');
        }

        // 2. Fetch Weather (Istanbul)
        let weatherInfo = 'Hava durumu bilgisi şu an alınamadı.';
        try {
          const weatherRes = await weatherSkill.execute({
            userMessage: 'Istanbul hava durumu',
            userId: 'SYSTEM_HEARTBEAT',
          });
          weatherInfo = weatherRes.text;
        } catch (err) {
          safeLog('Heartbeat: Weather fetch failed');
        }

        const dynamicMessage = [
          `${APP_EMOJI} **Günaydın! Günlük Brifing (Saat 10:00)**`,
          '',
          `📊 **Piyasa Özeti (KAYA):**`,
          marketSummary,
          '',
          `☁️ **Hava Durumu:**`,
          weatherInfo,
          '',
          '---',
          '📌 Bugün **#1 önceliğin** ne?',
          '📌 Kaldırmamı istediğin bir **engel** var mı?',
          '',
          '_Harika bir gün olsun!_ 🚀',
        ].join('\n');

        for (const userId of userIds) {
          await bot.api.sendMessage(Number(userId), dynamicMessage, {
            parse_mode: 'Markdown',
          });
          safeLog('Daily Briefing sent', { userId });
        }
      } catch (error) {
        safeLog('Daily Briefing send failed');
      }
    },
    {
      timezone: env.HEARTBEAT_TIMEZONE,
    }
  );

  safeLog('Daily Briefing scheduler started', {
    cron: cronExpression,
    timezone: env.HEARTBEAT_TIMEZONE,
  });
}

export async function sendHeartbeatNow(bot: Bot): Promise<void> {
  const env = getEnv();
  const userIds = env.TELEGRAM_ALLOWLIST_USER_ID.split(',').map((id) => id.trim());

  safeLog('Sending manual Daily Briefing...');

  // 1. Fetch Market Summary (KAYA)
  let marketSummary = 'Piyasa bilgisi şu an alınamadı.';
  try {
    const kayaRes = await borsaciAgent.analyzeMarket(
      'Piyasa özeti geç ve günün öne çıkan finansal haberlerini listele.'
    );
    marketSummary = kayaRes.content;
  } catch (err) {
    safeLog('Manual Heartbeat: KAYA summary failed');
  }

  // 2. Fetch Weather (Istanbul)
  let weatherInfo = 'Hava durumu bilgisi şu an alınamadı.';
  try {
    const weatherRes = await weatherSkill.execute({
      userMessage: 'Istanbul hava durumu',
      userId: 'SYSTEM_HEARTBEAT',
    });
    weatherInfo = weatherRes.text;
  } catch (err) {
    safeLog('Manual Heartbeat: Weather fetch failed');
  }

  const dynamicMessage = [
    `${APP_EMOJI} **Manuel Brifing Raporu**`,
    '',
    `📊 **Piyasa Özeti (KAYA):**`,
    marketSummary,
    '',
    `☁️ **Hava Durumu:**`,
    weatherInfo,
    '',
    '---',
    '_Rapor hazır!_ 🚀',
  ].join('\n');

  for (const userId of userIds) {
    await bot.api.sendMessage(Number(userId), dynamicMessage, {
      parse_mode: 'Markdown',
    });
  }

  safeLog('Manual Daily Briefing sent');
}
