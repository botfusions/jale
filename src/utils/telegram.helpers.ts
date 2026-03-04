import { Context } from 'grammy';
import { safeError, safeLog } from './logger';

/**
 * Sends a message to Telegram with Markdown support, but falls back to
 * plain text if Markdown parsing fails (prevents 400 Bad Request if LLM
 * generates invalid markdown like unclosed underscores).
 */
export async function safeReply(ctx: Context, text: string): Promise<void> {
  try {
    // Try original Markdown (V1)
    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (error: any) {
    if (
      error.message?.includes("can't parse entities") ||
      error.description?.includes("can't parse entities")
    ) {
      safeLog('Telegram Markdown parsing failed, falling back to plain text', {
        error: error.message,
      });
      try {
        // Fallback: Send as plain text
        await ctx.reply(text);
      } catch (fallbackError: any) {
        safeError('Telegram fallback reply also failed', fallbackError);
        throw fallbackError;
      }
    } else {
      throw error;
    }
  }
}
