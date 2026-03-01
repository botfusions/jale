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

  try {
    const checkResponse = await fetch(`${baseUrl}/collections/${collection}`, { method: 'GET', headers, signal: AbortSignal.timeout(5000) });
    if (checkResponse.ok) { collectionEnsured = true; return; }
    await fetch(`${baseUrl}/collections/${collection}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ vectors: { size: 1536, distance: 'Cosine' } }),
      signal: AbortSignal.timeout(10000),
    });
    collectionEnsured = true;
  } catch (error) {
    safeError('Qdrant collection check failed', error);
  }
}

export async function storeMemory(text: string, userId: string, source: string = 'user'): Promise<string> {
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

    await fetch(`${baseUrl}/collections/${collection}/points`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        points: [{ id, vector: embedding, payload: { text, source, timestamp, userId } }],
      }),
      signal: AbortSignal.timeout(10000),
    });
    return id;
  } catch (error) {
    safeError('Qdrant store failed, saved to local JSON', error);
    return id;
  }
}

export async function recallMemories(query: string, topK: number = 5): Promise<MemoryRecord[]> {
  const env = getEnv();

  if (env.VECTOR_DB_MOCK_MODE) {
    const results = memoryManager.search(query, topK);
    return results.map(m => ({
      id: m.id,
      text: m.text,
      metadata: { source: m.source, timestamp: m.timestamp, userId: m.userId }
    }));
  }

  try {
    // Qdrant araması... (mevcut mantık korunur)
    await ensureCollection();
    const embedding = await generateEmbedding(query);
    const response = await fetch(`${env.QDRANT_URL}/collections/${env.QDRANT_COLLECTION}/points/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(env.QDRANT_API_KEY ? { 'api-key': env.QDRANT_API_KEY } : {}) },
      body: JSON.stringify({ vector: embedding, limit: topK, with_payload: true, score_threshold: 0.5 }),
    });
    if (!response.ok) throw new Error('Qdrant search failed');
    const data = await response.json() as any;
    return data.result.map((match: any) => ({
      id: String(match.id),
      text: match.payload.text,
      metadata: { source: match.payload.source, timestamp: match.payload.timestamp, userId: match.payload.userId }
    }));
  } catch (error) {
    // Qdrant hata verirse JSON hafızadan getir
    const results = memoryManager.search(query, topK);
    return results.map(m => ({
      id: m.id,
      text: m.text,
      metadata: { source: m.source, timestamp: m.timestamp, userId: m.userId }
    }));
  }
}
