/**
 * Vector Service — Qdrant Memory Storage (Optimized with JSON Fallback)
 */

import { getEnv } from '../config/env';
import { safeLog, safeError } from '../utils/logger';
import { withRetry } from '../utils/retry';
import { generateEmbedding } from '../llm/openrouter';
import { v4 as uuidv4 } from 'uuid';
import { MemoryManager, MemoryItem } from './memory-manager';

export interface MemoryRecord {
  id: string;
  text: string;
  metadata: {
    source: string;
    timestamp: string;
    userId: string;
  };
}

const memoryManager = MemoryManager.getInstance();
let collectionEnsured = false;

async function ensureCollection(): Promise<void> {
  if (collectionEnsured) return;
  const env = getEnv();
  const baseUrl = env.QDRANT_URL;
  const collection = env.QDRANT_COLLECTION;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (env.QDRANT_API_KEY) headers['api-key'] = env.QDRANT_API_KEY;

  const tryUrl = async (url: string) => {
    try {
      const checkResponse = await fetch(`${url}/collections/${collection}`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(3000),
      });
      return checkResponse.ok;
    } catch {
      return false;
    }
  };

  // 1. Try configured URL
  if (await tryUrl(baseUrl)) {
    collectionEnsured = true;
    return;
  }

  // 2. Try internal Docker fallback if external fails
  const internalFallback = 'http://qdrant:6333';
  if (baseUrl !== internalFallback && (await tryUrl(internalFallback))) {
    safeLog('Connected to Qdrant via internal Docker fallback', { internalFallback });
    // Update runtime env so subsequent calls use the working URL
    const { updateEnvRuntime } = await import('../config/env');
    updateEnvRuntime('QDRANT_URL', internalFallback);
    collectionEnsured = true;
    return;
  }

  // 3. Fallback to PUT (create) if reachable but not found
  try {
    const res = await fetch(`${baseUrl}/collections/${collection}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ vectors: { size: 1536, distance: 'Cosine' } }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) collectionEnsured = true;
  } catch (error) {
    safeError('Qdrant connection/creation failed', error);
  }
}

export async function storeMemory(
  text: string,
  userId: string,
  source: string = 'user'
): Promise<string> {
  const env = getEnv();
  const id = uuidv4();
  const timestamp = new Date().toISOString();

  // Her zaman JSON tabanlı yerel hafızaya kaydet (Kalıcılık için)
  memoryManager.addMemory({ id, text, timestamp, userId, source });

  if (env.VECTOR_DB_MOCK_MODE) {
    safeLog('Memory stored in local JSON (mock mode)', { id });
    return id;
  }

  try {
    await ensureCollection();
    const embedding = await withRetry(() => generateEmbedding(text), 'Embedding for store');
    const baseUrl = env.QDRANT_URL;
    const collection = env.QDRANT_COLLECTION;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (env.QDRANT_API_KEY) headers['api-key'] = env.QDRANT_API_KEY;

    const res = await fetch(`${baseUrl}/collections/${collection}/points`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        points: [{ id, vector: embedding, payload: { text, source, timestamp, userId } }],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Qdrant error (${res.status}): ${errorText}`);
    }

    safeLog('Memory stored in Qdrant', { id });
    return id;
  } catch (error) {
    safeError('Qdrant store failed', error);
    // Rethrow to let the caller know it failed to sync with vector DB
    throw error;
  }
}

export async function recallMemories(
  query: string,
  userId: string,
  topK: number = 5
): Promise<MemoryRecord[]> {
  const env = getEnv();

  if (env.VECTOR_DB_MOCK_MODE) {
    const results = memoryManager.search(query, userId, topK);
    return results.map((m) => ({
      id: m.id,
      text: m.text,
      metadata: { source: m.source, timestamp: m.timestamp, userId: m.userId },
    }));
  }

  try {
    // Qdrant araması... (mevcut mantık korunur)
    await ensureCollection();
    const embedding = await generateEmbedding(query);
    const response = await fetch(
      `${env.QDRANT_URL}/collections/${env.QDRANT_COLLECTION}/points/search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(env.QDRANT_API_KEY ? { 'api-key': env.QDRANT_API_KEY } : {}),
        },
        body: JSON.stringify({
          vector: embedding,
          limit: topK,
          with_payload: true,
          score_threshold: 0.5,
          filter: {
            must: [{ key: 'userId', match: { value: userId } }],
          },
        }),
      }
    );
    if (!response.ok) throw new Error('Qdrant search failed');
    const data = (await response.json()) as any;
    return data.result.map((match: any) => ({
      id: String(match.id),
      text: match.payload.text,
      metadata: {
        source: match.payload.source,
        timestamp: match.payload.timestamp,
        userId: match.payload.userId,
      },
    }));
  } catch (error) {
    // Qdrant hata verirse JSON hafızadan getir
    const results = memoryManager.search(query, userId, topK);
    return results.map((m) => ({
      id: m.id,
      text: m.text,
      metadata: { source: m.source, timestamp: m.timestamp, userId: m.userId },
    }));
  }
}

/**
 * Analyze an image and store its description in memory.
 */
export async function storeImageMemory(
  imageUrl: string,
  userId: string,
  source: string = 'user'
): Promise<string> {
  const env = getEnv();
  const id = uuidv4();
  const timestamp = new Date().toISOString();

  try {
    // 1. Her zaman vision yeteneği olan bir model kullanarak resmi analiz et
    // Bu aşamada openrouter.ts içindeki chat fonksiyonunu kullanıyoruz.
    // Not: Vision desteği için mesaj yapısının image_url içermesi gerekir.
    const { chat } = await import('../llm/openrouter');

    // Vision için OpenAI formatında mesaj içeriği hazırlıyoruz
    const visionMessages: any[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Bu resimde ne görüyorsun? Hafızada saklanmak üzere detaylı ama öz bir açıklama yap.',
          },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ];

    const response = await chat(null, visionMessages, '', [], 'openai/gpt-4o-mini');
    const text = `[GÖRSEL ANALİZİ] ${response.content}`;

    // 2. Her zaman JSON tabanlı yerel hafızaya kaydet
    memoryManager.addMemory({ id, text, timestamp, userId, source });

    if (env.VECTOR_DB_MOCK_MODE) {
      safeLog('Image memory stored in local JSON (mock mode)', { id });
      return id;
    }

    // 3. Qdrant'a kaydet
    await ensureCollection();
    const embedding = await withRetry(() => generateEmbedding(text), 'Embedding for image store');
    const baseUrl = env.QDRANT_URL;
    const collection = env.QDRANT_COLLECTION;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (env.QDRANT_API_KEY) headers['api-key'] = env.QDRANT_API_KEY;

    const res = await fetch(`${baseUrl}/collections/${collection}/points`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        points: [
          {
            id,
            vector: embedding,
            payload: { text, source, timestamp, userId, type: 'image', imageUrl },
          },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Qdrant error (${res.status}): ${errorText}`);
    }

    safeLog('Image memory stored in Qdrant', { id });
    return id;
  } catch (error) {
    safeError('Qdrant image store failed', error);
    throw error;
  }
}
