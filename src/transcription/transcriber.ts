import fs from 'fs';
import path from 'path';
import { getEnv } from '../config/env';
import { safeLog, safeError } from '../utils/logger';

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

export async function transcribeAudio(filePath: string): Promise<TranscriptionResult> {
  const env = getEnv();

  if (env.TRANSCRIPTION_MOCK_MODE) {
    return mockTranscribe(filePath);
  }

  return realTranscribe(filePath, env.TRANSCRIPTION_API_KEY);
}

async function mockTranscribe(filePath: string): Promise<TranscriptionResult> {
  safeLog('Mock transcription mode', { file: path.basename(filePath) });

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    text: '[Mock Transcription] Bu bir test ses mesajıdır. Gerçek API bağlandığında burada gerçek metin olacak.',
    language: 'tr',
    duration: 5,
  };
}

async function realTranscribe(filePath: string, apiKey: string): Promise<TranscriptionResult> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'audio/ogg' });

    const formData = new FormData();
    formData.append('file', blob, path.basename(filePath));
    formData.append('model', 'whisper-1');
    formData.append('language', 'tr');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transcription API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as { text: string };

    safeLog('Transcription completed', { textLength: data.text.length });

    return {
      text: data.text,
      language: 'tr',
    };
  } catch (error) {
    safeError('Transcription failed', error);
    throw error;
  }
}
