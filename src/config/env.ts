import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
  TELEGRAM_ALLOWLIST_USER_ID: z.string().min(1, 'TELEGRAM_ALLOWLIST_USER_ID is required'),

  // LLM (OpenRouter)
  MODEL_API_KEY: z.string().min(1, 'MODEL_API_KEY is required'),
  MODEL_NAME: z.string().default('anthropic/claude-sonnet-4'),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  MAX_TOKENS: z
    .string()
    .default('2048')
    .transform((v) => parseInt(v, 10)),
  TEMPERATURE: z
    .string()
    .default('0.7')
    .transform((v) => parseFloat(v)),

  // System Prompt
  SYSTEM_PROMPT_PATH: z.string().default('memory/soul.md'),

  // Transcription
  TRANSCRIPTION_API_KEY: z.string().optional().default(''),
  TRANSCRIPTION_MOCK_MODE: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),

  // TTS — ElevenLabs (primary) + OpenAI (fallback)
  ELEVENLABS_API_KEY: z.string().optional().default(''),
  ELEVENLABS_VOICE_ID: z.string().default('21m00Tcm4TlvDq8ikWAM'), // Rachel
  TTS_API_KEY: z.string().optional().default(''),
  TTS_MOCK_MODE: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),

  // Vector DB (Qdrant)
  QDRANT_URL: z.string().url().optional().default('http://localhost:6333'),
  QDRANT_API_KEY: z.string().optional().default(''),
  QDRANT_COLLECTION: z.string().default('agent-claw-memory'),
  VECTOR_DB_MOCK_MODE: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),

  // Legacy Pinecone (kept for backward compat, unused)
  VECTOR_DB_API_KEY: z.string().optional().default(''),
  VECTOR_DB_INDEX: z.string().default('agent-claw-memory'),

  // Heartbeat
  HEARTBEAT_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  HEARTBEAT_CRON: z.string().default('0 8 * * *'),
  HEARTBEAT_TIMEZONE: z.string().default('Europe/Istanbul'),

  // Google Calendar
  GOOGLE_CALENDAR_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  GOOGLE_CALENDAR_ID: z.string().default('primary'),
  GOOGLE_SERVICE_ACCOUNT_JSON: z.string().optional().default(''),

  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  TEMP_DIR: z.string().default('./tmp'),

  // LightRAG
  LIGHTRAG_URL: z.string().url().default('https://light-rag.turklawai.com'),
  LIGHTRAG_API_KEY: z.string().optional().default(''),

  // OpenWeatherMap
  OPENWEATHERMAP_API_KEY: z.string().optional().default(''),
});

export type EnvConfig = z.infer<typeof envSchema>;

let _env: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!_env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error('❌ Environment validation failed:');
      for (const issue of result.error.issues) {
        console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
      }
      process.exit(1);
    }
    _env = result.data;
  }
  return _env;
}

/**
 * Update a runtime env value (for dynamic model switching etc.)
 * Only affects in-memory config, not the .env file.
 */
export function updateEnvRuntime(key: keyof EnvConfig, value: any): void {
  const env = getEnv();
  (env as any)[key] = value;
}

/**
 * Reset cached env (forces re-read from process.env)
 */
export function resetEnv(): void {
  _env = null;
}

export function maskSecret(value: string): string {
  if (value.length <= 8) return '****';
  return value.substring(0, 4) + '****' + value.substring(value.length - 4);
}
