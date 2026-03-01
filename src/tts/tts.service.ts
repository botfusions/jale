/**
 * TTS Service — ElevenLabs (primary) + OpenAI (fallback)
 *
 * Uses ElevenLabs for high-quality voice synthesis.
 * Falls back to OpenAI TTS if ElevenLabs is unavailable.
 * Mock mode for development without API keys.
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getEnv } from '../config/env';
import { safeLog, safeError } from '../utils/logger';

const TEMP_DIR = path.resolve(process.cwd(), 'tmp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Convert text to speech audio file.
 * Priority: ElevenLabs → OpenAI → Mock
 */
export async function textToSpeech(text: string): Promise<string> {
  const env = getEnv();
  const outputPath = path.join(TEMP_DIR, `tts_${uuidv4()}.mp3`);

  // Mock mode
  if (env.TTS_MOCK_MODE) {
    safeLog('TTS mock mode — generating silent file');
    // Create a minimal valid MP3 file (silence)
    const silentMp3 = Buffer.alloc(256, 0);
    fs.writeFileSync(outputPath, silentMp3);
    return outputPath;
  }

  // Try ElevenLabs first
  if (env.ELEVENLABS_API_KEY) {
    try {
      const result = await elevenLabsTTS(text, env.ELEVENLABS_API_KEY, env.ELEVENLABS_VOICE_ID);
      fs.writeFileSync(outputPath, result);
      safeLog('ElevenLabs TTS completed', { textLength: text.length, outputSize: result.length });
      return outputPath;
    } catch (error) {
      safeError('ElevenLabs TTS failed, falling back to OpenAI', error);
    }
  }

  // Fallback to OpenAI TTS
  if (env.TTS_API_KEY) {
    try {
      const result = await openAiTTS(text, env.TTS_API_KEY);
      fs.writeFileSync(outputPath, result);
      safeLog('OpenAI TTS completed (fallback)', {
        textLength: text.length,
        outputSize: result.length,
      });
      return outputPath;
    } catch (error) {
      safeError('OpenAI TTS also failed', error);
      throw new Error('All TTS providers failed');
    }
  }

  throw new Error('No TTS API key configured');
}

/**
 * ElevenLabs Text-to-Speech via REST API
 */
async function elevenLabsTTS(text: string, apiKey: string, voiceId: string): Promise<Buffer> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error ${response.status}: ${errorText.substring(0, 200)}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * OpenAI Text-to-Speech (fallback)
 */
async function openAiTTS(text: string, apiKey: string): Promise<Buffer> {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: 'nova',
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI TTS error ${response.status}: ${errorText.substring(0, 200)}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Clean up a temp file
 */
export function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      safeLog('Temp file cleaned', { file: path.basename(filePath) });
    }
  } catch (error) {
    safeError('Failed to clean temp file', error);
  }
}

/**
 * Clean up all temp files
 */
export function cleanupAllTempFiles(): void {
  try {
    if (!fs.existsSync(TEMP_DIR)) return;
    const files = fs.readdirSync(TEMP_DIR);
    let count = 0;
    for (const file of files) {
      if (file.startsWith('tts_') || file.startsWith('voice_')) {
        fs.unlinkSync(path.join(TEMP_DIR, file));
        count++;
      }
    }
    safeLog('All temp files cleaned', { count });
  } catch (error) {
    safeError('Failed to clean temp directory', error);
  }
}
