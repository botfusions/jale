/**
 * Retry Utility — Exponential backoff for API calls
 *
 * Handles transient errors (network, rate limit 429, server 5xx)
 * with configurable retry count and backoff multiplier.
 */

import { safeLog, safeError } from './logger';

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatusCodes: number[];
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 15000,
  retryableStatusCodes: [429, 500, 502, 503, 504],
};

export class RetryableError extends Error {
  statusCode?: number;
  retryAfter?: number;

  constructor(message: string, statusCode?: number, retryAfter?: number) {
    super(message);
    this.name = 'RetryableError';
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
  }
}

/**
 * Execute a function with exponential backoff retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) {
        safeLog(`${label} succeeded after ${attempt} retries`);
      }
      return result;
    } catch (error: any) {
      lastError = error;

      // Check if retryable
      const isRetryable = isRetryableError(error, opts.retryableStatusCodes);

      if (!isRetryable || attempt === opts.maxRetries) {
        safeError(`${label} failed permanently after ${attempt + 1} attempts`, error);
        throw error;
      }

      // Calculate delay
      const delay = calculateDelay(attempt, opts, error);

      safeLog(`${label} attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
        error: error.message?.substring(0, 100),
        statusCode: error.statusCode,
        attempt: attempt + 1,
        maxRetries: opts.maxRetries,
      });

      await sleep(delay);
    }
  }

  throw lastError || new Error(`${label} failed after all retries`);
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, retryableStatusCodes: number[]): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Timeout errors
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return true;
  }

  // HTTP status code based
  if (error.statusCode && retryableStatusCodes.includes(error.statusCode)) {
    return true;
  }

  // OpenAI/OpenRouter specific error detection
  if (error.status && retryableStatusCodes.includes(error.status)) {
    return true;
  }

  // Rate limit detection from error message
  if (error.message?.toLowerCase().includes('rate limit')) {
    return true;
  }

  return false;
}

/**
 * Calculate delay with exponential backoff + jitter
 */
function calculateDelay(attempt: number, opts: RetryOptions, error: any): number {
  // Respect Retry-After header if present
  if (error instanceof RetryableError && error.retryAfter) {
    return Math.min(error.retryAfter * 1000, opts.maxDelayMs);
  }

  // Exponential backoff with jitter
  const exponentialDelay = opts.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * opts.baseDelayMs * 0.5;
  return Math.min(exponentialDelay + jitter, opts.maxDelayMs);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * User-friendly error message generator
 */
export function getUserFriendlyError(error: any): string {
  if (error.statusCode === 429 || error.status === 429) {
    return '⏳ API istek limiti aşıldı. Lütfen biraz bekleyip tekrar deneyin.';
  }
  if (error.statusCode === 401 || error.status === 401) {
    return '🔑 API anahtarı geçersiz. Lütfen yöneticiyle iletişime geçin.';
  }
  if (error.statusCode === 402 || error.status === 402) {
    return '💳 API kredisi yetersiz. Hesabı kontrol edin.';
  }
  if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
    return '🌐 Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
  }
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return '⏱️ İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
  }
  return '❌ Bir hata oluştu. Lütfen tekrar deneyin.';
}
