import { spawnCommand } from './shell';
import { safeLog, safeError } from './logger';

/**
 * Summarize Utility
 * Uses steipete's summarize CLI to get the gist of URLs, YouTube videos, or files.
 */

export interface SummarizeOptions {
  length?: 'short' | 'medium' | 'long' | 'auto';
  model?: string;
  format?: 'markdown' | 'text' | 'json';
}

/**
 * Summarizes a URL or File Path using the summarize CLI.
 */
export async function summarizeContent(target: string, options: SummarizeOptions = {}): Promise<string> {
  const { length = 'medium', model = 'anthropic/claude-sonnet-4.6', format = 'markdown' } = options;
  
  safeLog(`[Summarize Utility] Summarizing: ${target}`, { length, model });

  try {
    const args = [
      target,
      '--length', length,
      '--model', model,
      '--format', format
    ];

    // Using spawnCommand with npx to ensure summarize is available
    const result = await spawnCommand('npx', ['summarize', ...args]);

    if (result.stdout) {
      return result.stdout.trim();
    } else {
      throw new Error(`Summarize returned empty output. Stderr: ${result.stderr}`);
    }
  } catch (error: any) {
    safeError('[Summarize Utility] Failed to summarize', error);
    throw error;
  }
}
