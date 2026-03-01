import express, { Request, Response } from 'express';
import { createBot } from './telegram/bot';
import {
  handleStart,
  handleHelp,
  handleStatus,
  handleRemember,
  handleRecall,
  handleTextMessage,
  handleVoiceMessage,
  handleJaleCommand,
  handleOsmanCommand,
  handleResearchCommand,
} from './handlers/message.handler';
import { handleVapiWebhook } from './webhook/vapi-webhook';
import { startHeartbeat } from './scheduler/heartbeat';
import { getEnv, maskSecret } from './config/env';
import { safeLog } from './utils/logger';
import { APP_NAME, APP_VERSION, APP_EMOJI, COMMANDS } from './config/constants';
import { cleanupAllTempFiles } from './tts/tts.service';
import { registerAllSkills } from './skills';
import { registerAllCommands } from './commands';
import { loadConversations, flushConversations } from './memory/conversation-store';

const HTTP_PORT = process.env.HTTP_PORT || 3000;

async function main(): Promise<void> {
  // Load and validate environment
  const env = getEnv();

  console.log(`
╔══════════════════════════════════════════╗
║  ${APP_EMOJI}  ${APP_NAME} v${APP_VERSION}                     ║
║  Telegram AI Assistant + Vapi Webhook    ║
╚══════════════════════════════════════════╝
  `);

  safeLog('Starting Agent Claw', {
    version: APP_VERSION,
    environment: env.NODE_ENV,
    model: env.MODEL_NAME,
    voiceEnabled: !env.TRANSCRIPTION_MOCK_MODE,
    ttsEnabled: !env.TTS_MOCK_MODE,
    memoryEnabled: !env.VECTOR_DB_MOCK_MODE,
    heartbeatEnabled: env.HEARTBEAT_ENABLED,
    httpPort: HTTP_PORT,
  });

  // Startup security log
  console.log(`🤖 Model: ${env.MODEL_NAME}`);
  console.log(`🔑 API Key: ${maskSecret(env.MODEL_API_KEY)}`);
  console.log(`📱 Telegram Token: ${maskSecret(env.TELEGRAM_BOT_TOKEN)}`);
  console.log(`👤 Allowed Users: ${env.TELEGRAM_ALLOWLIST_USER_ID}`);
  console.log(`🎤 Voice Transcription: ${env.TRANSCRIPTION_MOCK_MODE ? 'Mock Mode' : 'Active'}`);
  console.log(`🔊 TTS: ${env.TTS_MOCK_MODE ? 'Mock Mode' : 'Active'}`);
  console.log(`🧠 Memory: ${env.VECTOR_DB_MOCK_MODE ? 'Mock Mode' : 'Active'}`);
  console.log(`💓 Heartbeat: ${env.HEARTBEAT_ENABLED ? 'Enabled' : 'Disabled'}`);
  console.log(`🌡️ Temperature: ${env.TEMPERATURE} | Max Tokens: ${env.MAX_TOKENS}`);
  console.log(`🌐 HTTP Server: Port ${HTTP_PORT}`);
  console.log('');

  // Load persistent conversation history
  loadConversations();

  // ==========================================
  // HTTP Server (Express) - Vapi Webhook
  // ==========================================
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      name: APP_NAME,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
    });
  });

  // Vapi webhook endpoint
  app.post('/webhook/vapi', handleVapiWebhook);

  // Start HTTP server
  app.listen(HTTP_PORT, () => {
    console.log(`🌐 HTTP Server started on port ${HTTP_PORT}`);
    console.log(`📡 Vapi Webhook: http://localhost:${HTTP_PORT}/webhook/vapi`);
    console.log(`❤️ Health Check: http://localhost:${HTTP_PORT}/health`);
  });

  // ==========================================
  // Telegram Bot
  // ==========================================

  // Create bot
  const bot = createBot();

  // Register core command handlers
  bot.command(COMMANDS.START, handleStart);
  bot.command(COMMANDS.HELP, handleHelp);
  bot.command(COMMANDS.STATUS, handleStatus);
  bot.command(COMMANDS.REMEMBER, handleRemember);
  bot.command(COMMANDS.RECALL, handleRecall);
  bot.command(COMMANDS.JALE, handleJaleCommand);
  bot.command(COMMANDS.OSMAN, handleOsmanCommand);
  bot.command(COMMANDS.RESEARCH, handleResearchCommand);

  // Register skills
  registerAllSkills();

  // Register modular commands (calendar, mail, voice, tools, skills)
  registerAllCommands(bot);

  // Voice message handler
  bot.on('message:voice', async (ctx) => {
    await handleVoiceMessage(ctx, bot);
  });

  // Text message handler (catch-all, must be last)
  bot.on('message:text', async (ctx) => {
    // Skip if it's a command (already handled)
    if (ctx.message.text.startsWith('/')) return;
    await handleTextMessage(ctx);
  });

  // Error handler
  bot.catch((err) => {
    safeLog('Bot error occurred');
    console.error('Bot error:', err.message);
  });

  // Start heartbeat scheduler
  startHeartbeat(bot);

  // Clean up temp files on start
  cleanupAllTempFiles();

  // Start bot
  console.log('🚀 Agent Claw başlatılıyor...');
  await bot.start({
    onStart: () => {
      console.log(`✅ ${APP_NAME} aktif ve hazır!`);
      console.log("📱 Telegram'da bot'a mesaj gönderebilirsiniz.");
      console.log("📞 Vapi webhook'u dinleniyor.");
    },
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Agent Claw kapatılıyor...');
  flushConversations();
  cleanupAllTempFiles();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Agent Claw kapatılıyor...');
  flushConversations();
  cleanupAllTempFiles();
  process.exit(0);
});

// Run
main().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
