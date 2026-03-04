import { Context, Bot } from 'grammy';
import path from 'path';
import { chat, LLMMessage, getUserFriendlyError } from '../llm/openrouter';
import { transcribeAudio } from '../transcription/transcriber';
import { textToSpeech, cleanupTempFile } from '../tts/tts.service';
import { storeMemory, recallMemories } from '../memory/vector.service';
import { loadCoreMemory, appendMemoryLog } from '../memory/core.memory';
import { getHistory, addToHistory, getHistoryForLLM } from '../memory/conversation-store';
import { downloadFile } from '../telegram/bot';
import { safeReply } from '../utils/telegram.helpers';
import { getEnv } from '../config/env';
import { safeLog, safeError } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { CEOAgent } from '../agents/ceo-agent';
import { COOAgent } from '../agents/coo-agent';
import { researcherSkill } from '../skills/researcher.skill';
import { rateLimiter } from '../security/rate-limiter';
// import { isAdmin } from '../telegram/auth'; // Removed

const ceoAgent = new CEOAgent();
const cooAgent = new COOAgent();

import {
  MESSAGES,
  COMMANDS,
  APP_NAME,
  APP_VERSION,
  APP_EMOJI,
  VOICE_TRIGGERS,
} from '../config/constants';
import fs from 'fs';

// ==========================================
// COMMAND HANDLERS
// ==========================================

export async function handleStart(ctx: Context): Promise<void> {
  await safeReply(ctx, MESSAGES.WELCOME);
}

export async function handleHelp(ctx: Context): Promise<void> {
  await safeReply(ctx, MESSAGES.HELP);
}

export async function handleStatus(ctx: Context): Promise<void> {
  const env = getEnv();
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  const status = [
    `${APP_EMOJI} **${APP_NAME} v${APP_VERSION}**`,
    '',
    `🟢 **Durum:** Çalışıyor`,
    `⏱️ **Çalışma Süresi:** ${hours}s ${minutes}dk`,
    `🤖 **Model:** ${env.MODEL_NAME}`,
    `🌡️ **Temperature:** ${env.TEMPERATURE} | **Max Tokens:** ${env.MAX_TOKENS}`,
    `🎤 **Ses Tanıma:** ${env.TRANSCRIPTION_MOCK_MODE ? 'Mock Mod' : 'Aktif'}`,
    `🔊 **TTS:** ${env.TTS_MOCK_MODE ? 'Mock Mod' : 'Aktif'}`,
    `🧠 **Hafıza:** ${env.VECTOR_DB_MOCK_MODE ? 'Mock Mod (Qdrant bağlı değil)' : 'Qdrant Aktif'}`,
    `💓 **Heartbeat:** ${env.HEARTBEAT_ENABLED ? 'Açık' : 'Kapalı'}`,
    `🌍 **Ortam:** ${env.NODE_ENV}`,
  ].join('\n');

  await ctx.reply(status, { parse_mode: 'Markdown' });
}

export async function handleRemember(ctx: Context): Promise<void> {
  const text = ctx.message?.text?.replace(/^\/remember\s*/i, '').trim();
  const userId = ctx.from?.id?.toString() || 'unknown';

  if (!text) {
    await ctx.reply(
      '⚠️ Lütfen hatırlamam gereken bir şey yazın.\nÖrnek: `/remember Kahve sütlü olsun`',
      {
        parse_mode: 'Markdown',
      }
    );
    return;
  }

  try {
    const id = await storeMemory(text, userId, 'explicit_remember');
    appendMemoryLog(`[REMEMBER] User: ${userId} | "${text}"`);

    await ctx.reply(
      `✅ Hafızaya kaydedildi!\n\n📝 _"${text}"_\n🔑 ID: \`${id.substring(0, 8)}...\``,
      {
        parse_mode: 'Markdown',
      }
    );
  } catch (error) {
    safeError('Remember command failed', error);
    await ctx.reply('❌ Hafızaya kaydetme başarısız oldu. Lütfen tekrar deneyin.');
  }
}

export async function handleRecall(ctx: Context): Promise<void> {
  const query = ctx.message?.text?.replace(/^\/recall\s*/i, '').trim();

  if (!query) {
    await ctx.reply('⚠️ Lütfen arama sorgusu yazın.\nÖrnek: `/recall kahve tercihi`', {
      parse_mode: 'Markdown',
    });
    return;
  }

  try {
    const memories = await recallMemories(query);

    if (memories.length === 0) {
      await ctx.reply(`🔍 "${query}" ile ilgili hafızada bir şey bulunamadı.`);
      return;
    }

    const lines = memories.map((m, i) => `${i + 1}. _${m.text}_\n   📅 ${m.metadata.timestamp}`);

    await ctx.reply(`🧠 **"${query}" ile ilgili hatırlananlar:**\n\n${lines.join('\n\n')}`, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    safeError('Recall command failed', error);
    await ctx.reply('❌ Hafızadan çağırma başarısız oldu. Lütfen tekrar deneyin.');
  }
}

export async function handleJaleCommand(ctx: Context): Promise<void> {
  const text = ctx.message?.text?.replace(/^\/jale\s*/i, '').trim();
  const userId = ctx.from?.id?.toString() || 'unknown';

  if (!text) {
    await ctx.reply(
      '⚠️ Lütfen JALE ile paylaşmak istediğiniz konuyu yazın.\nÖrnek: `/jale Yeni bir ürün vizyonu belirleyelim.`',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  try {
    await ctx.api.sendChatAction(ctx.chat!.id, 'typing');
    const startTime = Date.now();
    const history = getHistoryForLLM(userId) as LLMMessage[];
    const response = await ceoAgent.processRequest(text, history);
    metrics.recordApiCall(Date.now() - startTime);
    addToHistory(userId, 'user', text);
    addToHistory(userId, 'assistant', response.content);
    await safeReply(ctx, `👸 **JALE (CEO):**\n\n${response.content}`);
  } catch (error) {
    metrics.recordError();
    safeError('Jale command failed', error);
    await ctx.reply('❌ JALE ile iletişim kurulamadı. Lütfen tekrar deneyin.');
  }
}

export async function handleOsmanCommand(ctx: Context): Promise<void> {
  const text = ctx.message?.text?.replace(/^\/osman\s*/i, '').trim();
  const userId = ctx.from?.id?.toString() || 'unknown';

  if (!text) {
    await ctx.reply(
      '⚠️ Lütfen planlamasını istediğiniz stratejiyi yazın.\nÖrnek: `/osman Vizyon planını teknik iş paketlerine böl.`',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  try {
    await ctx.api.sendChatAction(ctx.chat!.id, 'typing');
    const startTime = Date.now();
    const history = getHistoryForLLM(userId) as LLMMessage[];
    const response = await cooAgent.planExecution(text, history);
    metrics.recordApiCall(Date.now() - startTime);
    addToHistory(userId, 'user', text);
    addToHistory(userId, 'assistant', response.content);
    await safeReply(ctx, `👷 **OSMAN (COO):**\n\n${response.content}`);
  } catch (error) {
    metrics.recordError();
    safeError('Osman command failed', error);
    await ctx.reply('❌ OSMAN ile iletişim kurulamadı. Lütfen tekrar deneyin.');
  }
}

export async function handleResearchCommand(ctx: Context): Promise<void> {
  const text = ctx.message?.text?.replace(/^\/research\s*/i, '').trim();
  const userId = ctx.from?.id?.toString() || 'unknown';

  if (!text) {
    await ctx.reply(
      '⚠️ Lütfen araştırmak istediğiniz konuyu yazın.\nÖrnek: `/research Kuantum bilgisayarların güncel durumu nedir?`',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  try {
    await ctx.api.sendChatAction(ctx.chat!.id, 'typing');
    const startTime = Date.now();

    // Instead of raw text, we use the skill manager context
    const result = await researcherSkill.execute({
      userMessage: text,
      userId,
    });

    metrics.recordApiCall(Date.now() - startTime);

    addToHistory(userId, 'user', text);
    addToHistory(userId, 'assistant', result.text);

    await safeReply(ctx, result.text);
  } catch (error) {
    metrics.recordError();
    safeError('Research command failed', error);
    await ctx.reply('❌ Araştırma yapılamadı. Lütfen tekrar deneyin.');
  }
}

// ==========================================
// TEXT MESSAGE HANDLER
// ==========================================

export async function handleTextMessage(ctx: Context): Promise<void> {
  const text = ctx.message?.text;
  const userId = ctx.from?.id?.toString() || 'unknown';

  if (!text) return;

  // ==========================================
  // RATE LIMITING CHECK (Güvenlik)
  // ==========================================
  const rateLimit = rateLimiter.checkLimit(userId);

  if (!rateLimit.allowed) {
    const waitSeconds = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
    const waitMinutes = Math.ceil(waitSeconds / 60);

    safeLog('Rate limit exceeded', { userId, waitSeconds });

    await ctx.reply(
      `⚠️ **Rate Limit Aşıldı!**\n\n` +
        `Çok hızlı istek gönderiyorsunuz. Lütfen ${waitMinutes} dakika bekleyin.\n\n` +
        `⏱️ _Kalan süre: ${waitSeconds} saniye_`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Log remaining requests (debug için)
  if (rateLimit.remaining <= 5) {
    safeLog('Rate limit warning', { userId, remaining: rateLimit.remaining });
  }

  try {
    // Show typing action
    await ctx.api.sendChatAction(ctx.chat!.id, 'typing');

    // Build memory context
    const coreMemory = loadCoreMemory();
    const relevantMemories = await recallMemories(text, 3);
    const memoryContext = [
      coreMemory ? `Core Memory:\n${coreMemory}` : '',
      relevantMemories.length > 0
        ? `Recent relevant memories:\n${relevantMemories.map((m) => `- ${m.text}`).join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    // Get persistent conversation history
    const history = getHistoryForLLM(userId);

    // Get enabled skills as tools
    const { skillManager } = await import('../skills/skill-manager');
    const enabledSkills = skillManager.getEnabled();
    safeLog('Building tools for chat', { enabledSkills: enabledSkills.map((s) => s.name) });
    const tools = enabledSkills.map((skill) => ({
      type: 'function',
      function: {
        name: `delegate_to_${skill.name.replace(/-/g, '_')}`,
        description: skill.description,
        parameters: {
          type: 'object',
          properties: {
            request: {
              type: 'string',
              description: 'Specific request for this skill/agent.',
            },
          },
          required: ['request'],
        },
      },
    }));

    // Call LLM
    const startTime = Date.now();
    let response = await chat(text, history as LLMMessage[], memoryContext, tools);
    metrics.recordApiCall(Date.now() - startTime);

    // Handle tool calls recursively (max 5 levels)
    let toolCallDepth = 0;
    const MAX_TOOL_DEPTH = 5;

    const currentHistory: LLMMessage[] = [
      ...(history as LLMMessage[]),
      { role: 'user', content: text },
    ];

    while (
      response.tool_calls &&
      response.tool_calls.length > 0 &&
      toolCallDepth < MAX_TOOL_DEPTH
    ) {
      toolCallDepth++;
      safeLog('Tool call detected', { depth: toolCallDepth, calls: response.tool_calls.length });

      // Add the assistant message with tool calls to history
      currentHistory.push({
        role: 'assistant',
        content: response.content || null,
        tool_calls: response.tool_calls,
      });

      for (const call of response.tool_calls) {
        if (call.type === 'function') {
          const functionName = call.function.name;
          const args = JSON.parse(call.function.arguments || '{}');
          const skillName = functionName.replace('delegate_to_', '').replace(/_/g, '-');

          const skill = skillManager.get(skillName);
          let toolResult = '';

          if (skill && skill.enabled) {
            try {
              const res = await skill.execute({ userMessage: args.request, userId });
              toolResult = res.text;
              safeLog('Tool execution success', {
                skill: skillName,
                result: toolResult.substring(0, 100) + '...',
              });
            } catch (err: any) {
              safeError(`Tool execution failed: ${skillName}`, err);
              toolResult = `Hata: ${err.message}`;
            }
          } else {
            toolResult = `Skill ${skillName} bulunamadı veya kapalı.`;
          }

          currentHistory.push({ role: 'tool', content: toolResult, tool_call_id: call.id });
        }
      }

      // Call LLM again with tool results
      response = await chat(null, currentHistory, memoryContext, tools);
    }

    // Ensure we have content to send to Telegram
    if (!response.content && (!response.tool_calls || response.tool_calls.length === 0)) {
      response.content = 'Üzgünüm, bu isteği şu an işleyemiyorum (Boş yanıt).';
    } else if (!response.content && response.tool_calls && response.tool_calls.length > 0) {
      response.content = 'İşlem çok uzun sürdü, lütfen cevabı daha sonra tekrar sorun.';
    }

    // Add to persistent history
    addToHistory(userId, 'user', text);
    addToHistory(userId, 'assistant', response.content);

    // Check for voice reply trigger (Turkish + English)
    const lowerText = text.toLowerCase();
    const wantsVoice = VOICE_TRIGGERS.some((t) => lowerText.includes(t));

    if (wantsVoice) {
      try {
        // Send text first
        await safeReply(ctx, response.content);

        // Then voice
        await ctx.api.sendChatAction(ctx.chat!.id, 'record_voice');
        const ttsStartTime = Date.now();
        const audioPath = await textToSpeech(response.content);
        metrics.recordApiCall(Date.now() - ttsStartTime);

        if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 100) {
          await ctx.replyWithVoice(new (await import('grammy')).InputFile(audioPath));
        }

        cleanupTempFile(audioPath);
      } catch (ttsError) {
        safeError('TTS failed, text reply already sent', ttsError);
      }
    } else {
      await safeReply(ctx, response.content);
    }

    // Auto-store important messages
    await autoStoreMemory(text, response.content, userId);
  } catch (error: any) {
    metrics.recordError();
    safeError('Text message handler failed', error);
    const friendlyError = getUserFriendlyError(error);
    await ctx.reply(friendlyError);
  }
}

// ==========================================
// VOICE MESSAGE HANDLER
// ==========================================

export async function handleVoiceMessage(ctx: Context, bot: Bot): Promise<void> {
  const voice = ctx.message?.voice;
  const userId = ctx.from?.id?.toString() || 'unknown';

  if (!voice) return;

  // ==========================================
  // RATE LIMITING CHECK (Güvenlik)
  // ==========================================
  const rateLimit = rateLimiter.checkLimit(userId);

  if (!rateLimit.allowed) {
    const waitSeconds = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
    const waitMinutes = Math.ceil(waitSeconds / 60);

    safeLog('Rate limit exceeded (voice)', { userId, waitSeconds });

    await ctx.reply(
      `⚠️ **Rate Limit Aşıldı!**\n\n` +
        `Çok hızlı ses gönderiyorsunuz. Lütfen ${waitMinutes} dakika bekleyin.\n\n` +
        `⏱️ _Kalan süre: ${waitSeconds} saniye_`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  try {
    const env = getEnv();
    const tempDir = path.resolve(process.cwd(), env.TEMP_DIR);

    // Ensure temp dir exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = path.join(tempDir, `voice_${Date.now()}.ogg`);

    // Show typing
    await ctx.api.sendChatAction(ctx.chat!.id, 'typing');

    // Download voice file
    await downloadFile(bot, voice.file_id, filePath);

    // Transcribe
    const sttStartTime = Date.now();
    const transcription = await transcribeAudio(filePath);
    metrics.recordApiCall(Date.now() - sttStartTime);

    // Clean up voice file
    cleanupTempFile(filePath);

    // Process the transcribed text directly (no preview)
    await ctx.api.sendChatAction(ctx.chat!.id, 'typing');

    // Build memory context
    const coreMemory = loadCoreMemory();
    const relevantMemories = await recallMemories(transcription.text, 3);
    const memoryContext = [
      coreMemory ? `Core Memory:\n${coreMemory}` : '',
      relevantMemories.length > 0
        ? `Recent relevant memories:\n${relevantMemories.map((m) => `- ${m.text}`).join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const history = getHistoryForLLM(userId);

    const llmStartTime = Date.now();
    const response = await chat(transcription.text, history as LLMMessage[], memoryContext);
    metrics.recordApiCall(Date.now() - llmStartTime);

    addToHistory(userId, 'user', transcription.text);
    addToHistory(userId, 'assistant', response.content);

    // Voice messages always get a voice reply back
    // Send text reply first
    await safeReply(ctx, response.content);

    // Then send voice
    try {
      await ctx.api.sendChatAction(ctx.chat!.id, 'record_voice');
      const ttsStartTime = Date.now();
      const audioPath = await textToSpeech(response.content);
      metrics.recordApiCall(Date.now() - ttsStartTime);

      if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 100) {
        await ctx.replyWithVoice(new (await import('grammy')).InputFile(audioPath));
      }

      cleanupTempFile(audioPath);
    } catch (ttsError) {
      safeError('TTS reply failed', ttsError);
    }

    await autoStoreMemory(transcription.text, response.content, userId);
  } catch (error: any) {
    metrics.recordError();
    safeError('Voice message handler failed', error);
    const friendlyError = getUserFriendlyError(error);
    await ctx.reply(friendlyError || MESSAGES.TRANSCRIPTION_FAILED);
  }
}

// ==========================================
// AUTO-STORE MEMORY (for important facts)
// ==========================================

async function autoStoreMemory(userText: string, botReply: string, userId: string): Promise<void> {
  // Simple heuristic: store if user says "remember", "my name is", etc.
  const triggers = [
    'benim adım',
    'adım',
    'ismim',
    'hatırla',
    'unutma',
    'tercihim',
    'seviyorum',
    'sevmiyorum',
  ];
  const lowerText = userText.toLowerCase();

  if (triggers.some((t) => lowerText.includes(t))) {
    await storeMemory(userText, userId, 'auto_detect');
    appendMemoryLog(`[AUTO] User: ${userId} | "${userText}"`);
  }
}
