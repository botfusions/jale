/**
 * Conversation Store — Persistent chat history per user
 *
 * Stores conversation history in a JSON file so it survives bot restarts.
 * Each user gets their own history limited by MAX_HISTORY messages.
 */

import fs from 'fs';
import path from 'path';
import { safeLog, safeError } from '../utils/logger';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ConversationData {
  [userId: string]: ChatMessage[];
}

const MAX_HISTORY = 20;
const STORE_PATH = path.resolve(process.cwd(), 'data_memory', 'conversations.json');

let conversationData: ConversationData = {};

/**
 * Load conversations from disk on startup
 */
export function loadConversations(): void {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      conversationData = JSON.parse(raw);
      const userCount = Object.keys(conversationData).length;
      safeLog('Conversations loaded from disk', { userCount });
    } else {
      conversationData = {};
      safeLog('No conversation file found, starting fresh');
    }
  } catch (error) {
    safeError('Failed to load conversations from disk', error);
    conversationData = {};
  }
}

/**
 * Save conversations to disk (debounced internally)
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    persistToDisk();
  }, 2000); // Write at most every 2 seconds
}

function persistToDisk(): void {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(conversationData, null, 2), 'utf-8');
    safeLog('Conversations persisted to disk');
  } catch (error) {
    safeError('Failed to persist conversations to disk', error);
  }
}

/**
 * Get conversation history for a user
 */
export function getHistory(userId: string): ChatMessage[] {
  if (!conversationData[userId]) {
    conversationData[userId] = [];
  }
  return conversationData[userId];
}

/**
 * Add a message to user's conversation history
 */
export function addToHistory(userId: string, role: 'user' | 'assistant', content: string): void {
  const history = getHistory(userId);
  history.push({
    role,
    content,
    timestamp: new Date().toISOString(),
  });

  // Keep only last N messages
  if (history.length > MAX_HISTORY) {
    conversationData[userId] = history.slice(history.length - MAX_HISTORY);
  }

  scheduleSave();
}

/**
 * Clear conversation history for a user
 */
export function clearHistory(userId: string): void {
  conversationData[userId] = [];
  scheduleSave();
  safeLog('Conversation history cleared', { userId });
}

/**
 * Get history as LLM-compatible messages (without timestamps)
 */
export function getHistoryForLLM(
  userId: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return getHistory(userId)
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map(({ role, content }) => ({ role: role as 'user' | 'assistant', content }));
}

/**
 * Force save (call on shutdown)
 */
export function flushConversations(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  persistToDisk();
}
