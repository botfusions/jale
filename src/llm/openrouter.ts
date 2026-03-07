import OpenAI from 'openai';
import { getEnv } from '../config/env';
import { safeLog, safeError } from '../utils/logger';
import { withRetry, getUserFriendlyError } from '../utils/retry';
import { loadSoulPrompt } from '../memory/core.memory';

export type LLMContent = string | (LLMTextContent | LLMImageContent)[];

export interface LLMTextContent {
  type: 'text';
  text: string;
}

export interface LLMImageContent {
  type: 'image_url';
  image_url: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: LLMContent | null;
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  tool_calls?: any[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const env = getEnv();
    _client = new OpenAI({
      baseURL: env.OPENROUTER_BASE_URL,
      apiKey: env.MODEL_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'https://agent-claw.local',
        'X-Title': 'Agent Claw',
      },
      timeout: 60000, // 60 second timeout
    });
  }
  return _client;
}

/**
 * Reset the client (useful when env changes at runtime)
 */
export function resetClient(): void {
  _client = null;
  safeLog('LLM client reset');
}

export async function chat(
  userMessage: LLMContent | null,
  conversationHistory: LLMMessage[] = [],
  memoryContext: string = '',
  tools?: any[],
  overrideModel?: string
): Promise<LLMResponse> {
  const env = getEnv();
  const client = getClient();

  const soulPrompt = loadSoulPrompt();

  const systemMessage: LLMMessage = {
    role: 'system',
    content: [
      soulPrompt,
      memoryContext ? `\n\n--- Relevant Memories ---\n${memoryContext}` : '',
      "\nAlways respond in the user's language. If the user writes in Turkish, respond in Turkish.",
    ].join(''),
  };

  const messages: LLMMessage[] = [systemMessage, ...conversationHistory];

  if (userMessage) {
    messages.push({ role: 'user', content: userMessage });
  }

  // Use retry wrapper for resilience
  return withRetry(
    async () => {
      const targetModel = overrideModel || env.MODEL_NAME;
      safeLog('LLM request', {
        model: targetModel,
        messageCount: messages.length,
        hasTools: !!tools,
      });

      const requestBody: any = {
        model: targetModel,
        messages,
        max_tokens: env.MAX_TOKENS,
        temperature: env.TEMPERATURE,
      };

      if (tools && tools.length > 0) {
        requestBody.tools = tools;
        requestBody.tool_choice = 'auto';
      }

      const response = await client.chat.completions.create(requestBody);

      const choice = response.choices[0];
      const content = choice?.message?.content || '';
      const tool_calls = choice?.message?.tool_calls;

      safeLog('LLM response received', {
        model: response.model,
        tokens: response.usage?.total_tokens,
        hasToolCalls: !!tool_calls,
      });

      return {
        content,
        model: response.model || targetModel,
        tool_calls,
        usage: response.usage
          ? {
              prompt_tokens: response.usage.prompt_tokens,
              completion_tokens: response.usage.completion_tokens,
              total_tokens: response.usage.total_tokens,
            }
          : undefined,
      };
    },
    'LLM Chat',
    { maxRetries: 2, baseDelayMs: 2000 }
  );
}

/**
 * Generate embeddings via OpenRouter (for vector DB)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const env = getEnv();
  const client = getClient();

  return withRetry(
    async () => {
      const response = await client.embeddings.create({
        model: 'openai/text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    },
    'Embedding Generation',
    { maxRetries: 2, baseDelayMs: 1000 }
  );
}

/**
 * Get user-friendly error message for UI display
 */
export { getUserFriendlyError };
