/**
 * Vector Service — Qdrant Memory Storage
 *
 * Stores and retrieves conversation memories using Qdrant vector database.
 * Uses OpenRouter embedding API for text → vector conversion.
 * Falls back to mock (in-memory) storage when VECTOR_DB_MOCK_MODE is true.
 */

import { getEnv } from '../config/env';
import { safeLog, safeError } from '../utils/logger';
import { withRetry } from '../utils/retry';
import { generateEmbedding } from '../llm/openrouter';
import { v4 as uuidv4 } from 'uuid';

export interface MemoryRecord {
  id: string;
  text: string;
  metadata: {
    source: string;
    timestamp: string;
    userId: string;
  };
}

// Mock in-memory store for development
const mockStore: MemoryRecord[] = [];

// Qdrant collection setup flag
let collectionEnsured = false;

/**
 * Ensure Qdrant collection exists
 */
async function ensureCollection(): Promise<void> {
  if (collectionEnsured) return;

  const env = getEnv();
  const baseUrl = env.QDRANT_URL;
  const collection = env.QDRANT_COLLECTION;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (env.QDRANT_API_KEY) {
    headers['api-key'] = env.QDRANT_API_KEY;
  }

  try {
    // Check if collection exists
    const checkResponse = await fetch(`${baseUrl}/collections/${collection}`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (checkResponse.ok) {
      collectionEnsured = true;
      safeLog('Qdrant collection exists', { collection });
      return;
    }

    // Create collection with embedding dimensions (1536 for text-embedding-3-small)
    const createResponse = await fetch(`${baseUrl}/collections/${collection}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (createResponse.ok) {
      collectionEnsured = true;
      safeLog('Qdrant collection created', { collection });
    } else {
      const errorText = await createResponse.text();
      safeError('Failed to create Qdrant collection', new Error(errorText));
    }
  } catch (error) {
    safeError('Qdrant collection check failed', error);
  }
}

/**
 * Store a memory in Qdrant or mock store
 */
export async function storeMemory(
  text: string,
  userId: string,
  source: string = 'user'
): Promise<string> {
  const env = getEnv();
  const id = uuidv4();

  const record: MemoryRecord = {
    id,
    text,
    metadata: {
      source,
      timestamp: new Date().toISOString(),
      userId,
    },
  };

  if (env.VECTOR_DB_MOCK_MODE) {
    mockStore.push(record);
    safeLog('Memory stored (mock mode)', { id, textLength: text.length });
    return id;
  }

  // Real Qdrant integration
  try {
    await ensureCollection();

    // Generate embedding via OpenRouter
    const embedding = await withRetry(() => generateEmbedding(text), 'Embedding for store', {
      maxRetries: 2,
    });

    const baseUrl = env.QDRANT_URL;
    const collection = env.QDRANT_COLLECTION;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (env.QDRANT_API_KEY) {
      headers['api-key'] = env.QDRANT_API_KEY;
    }

    const response = await fetch(`${baseUrl}/collections/${collection}/points`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        points: [
          {
            id,
            vector: embedding,
            payload: {
              text,
              source: record.metadata.source,
              timestamp: record.metadata.timestamp,
              userId: record.metadata.userId,
            },
          },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Qdrant upsert failed: ${response.status} - ${errorText}`);
    }

    safeLog('Memory stored in Qdrant', { id });
    return id;
  } catch (error) {
    safeError('Failed to store memory in Qdrant, falling back to mock', error);
    // Fallback to mock
    mockStore.push(record);
    return id;
  }
}

/**
 * Recall memories from Qdrant by semantic search
 */
export async function recallMemories(query: string, topK: number = 5): Promise<MemoryRecord[]> {
  const env = getEnv();

  if (env.VECTOR_DB_MOCK_MODE) {
    // Simple keyword matching for mock mode
    const queryLower = query.toLowerCase();
    const results = mockStore
      .filter((r) => r.text.toLowerCase().includes(queryLower))
      .slice(0, topK);

    safeLog('Memory recalled (mock mode)', { query, resultCount: results.length });
    return results;
  }

  // Real Qdrant vector search
  try {
    await ensureCollection();

    // Generate embedding for query
    const embedding = await withRetry(() => generateEmbedding(query), 'Embedding for recall', {
      maxRetries: 2,
    });

    const baseUrl = env.QDRANT_URL;
    const collection = env.QDRANT_COLLECTION;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (env.QDRANT_API_KEY) {
      headers['api-key'] = env.QDRANT_API_KEY;
    }

    const response = await fetch(`${baseUrl}/collections/${collection}/points/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        vector: embedding,
        limit: topK,
        with_payload: true,
        score_threshold: 0.5, // Only return relevant results
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Qdrant search failed: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as {
      result: Array<{
        id: string;
        score: number;
        payload: Record<string, string>;
      }>;
    };

    return data.result.map((match) => ({
      id: String(match.id),
      text: match.payload.text || '',
      metadata: {
        source: match.payload.source || 'unknown',
        timestamp: match.payload.timestamp || '',
        userId: match.payload.userId || '',
      },
    }));
  } catch (error) {
    safeError('Failed to recall memories from Qdrant', error);
    return [];
  }
}

/**
 * Get mock store size (for diagnostics)
 */
export function getMockStoreSize(): number {
  return mockStore.length;
}

/**
 * Check Qdrant health
 */
export async function checkQdrantHealth(): Promise<boolean> {
  const env = getEnv();
  if (env.VECTOR_DB_MOCK_MODE) return true;

  try {
    const headers: Record<string, string> = {};
    if (env.QDRANT_API_KEY) {
      headers['api-key'] = env.QDRANT_API_KEY;
    }

    const response = await fetch(`${env.QDRANT_URL}/healthz`, {
      headers,
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
