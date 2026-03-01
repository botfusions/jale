import { getEnv } from '../config/env';
import { safeLog, safeError } from '../utils/logger';
import { withRetry } from '../utils/retry';

export interface LightRAGResponse {
  answer: string;
  sources: string[];
}

export class LightRAGClient {
  private static instance: LightRAGClient;

  private constructor() {}

  public static getInstance(): LightRAGClient {
    if (!LightRAGClient.instance) {
      LightRAGClient.instance = new LightRAGClient();
    }
    return LightRAGClient.instance;
  }

  /**
   * Query the LightRAG API
   * @param query The question to ask
   * @param mode 'naive', 'local', 'global', or 'hybrid' (LightRAG default modes)
   */
  public async query(
    query: string,
    mode: 'naive' | 'local' | 'global' | 'hybrid' = 'hybrid'
  ): Promise<string> {
    const env = getEnv();
    const url = `${env.LIGHTRAG_URL}/query`;

    safeLog('LightRAG query started', { mode, query: query.substring(0, 50) + '...' });

    return withRetry(
      async () => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(env.LIGHTRAG_API_KEY ? { Authorization: `Bearer ${env.LIGHTRAG_API_KEY}` } : {}),
          },
          body: JSON.stringify({
            query: query,
            mode: mode,
          }),
          signal: AbortSignal.timeout(30000), // 30s timeout for RAG
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`LightRAG query failed: ${response.status} - ${errorText}`);
        }

        const data = (await response.json()) as { response: string };
        safeLog('LightRAG response received');
        return data.response;
      },
      'LightRAG Query',
      { maxRetries: 1 }
    );
  }

  /**
   * Insert text into LightRAG knowledge graph
   */
  public async insert(text: string): Promise<boolean> {
    const env = getEnv();
    const url = `${env.LIGHTRAG_URL}/insert`;

    safeLog('LightRAG insertion started');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(env.LIGHTRAG_API_KEY ? { Authorization: `Bearer ${env.LIGHTRAG_API_KEY}` } : {}),
        },
        body: JSON.stringify({
          text: text,
        }),
        signal: AbortSignal.timeout(60000), // 60s for indexing
      });

      if (!response.ok) {
        const errorText = await response.text();
        safeError('LightRAG insertion failed', new Error(errorText));
        return false;
      }

      safeLog('LightRAG insertion successful');
      return true;
    } catch (error) {
      safeError('LightRAG insertion request failed', error);
      return false;
    }
  }
}
