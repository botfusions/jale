import pino from 'pino';
import { getEnv } from '../config/env';

const SENSITIVE_KEYS = [
  'token',
  'api_key',
  'apikey',
  'secret',
  'password',
  'authorization',
  'credential',
  'TELEGRAM_BOT_TOKEN',
  'MODEL_API_KEY',
  'TRANSCRIPTION_API_KEY',
  'TTS_API_KEY',
  'VECTOR_DB_API_KEY',
];

let _logger: pino.Logger | null = null;

export function getLogger(): pino.Logger {
  if (!_logger) {
    const env = getEnv();
    _logger = pino({
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    });
  }
  return _logger;
}

export function safeLog(message: string, data?: Record<string, unknown>): void {
  const logger = getLogger();
  if (data) {
    // Redact sensitive keys from data
    const safeData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEYS.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
        safeData[key] = '***REDACTED***';
      } else {
        safeData[key] = value;
      }
    }
    logger.info(safeData, message);
  } else {
    logger.info(message);
  }
}

export function safeError(message: string, error?: unknown): void {
  const logger = getLogger();
  if (error instanceof Error) {
    logger.error({ err: { message: error.message } }, message);
  } else {
    logger.error(message);
  }
}
