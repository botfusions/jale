/**
 * Agent Claw — Self Test Script
 * Run: npx tsx tests/self-test.ts
 *
 * Tests all modules without real API calls (mock mode).
 */

// Set test env vars BEFORE any imports (so Zod validation passes)
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'test-token-for-self-test';
process.env.TELEGRAM_ALLOWLIST_USER_ID = process.env.TELEGRAM_ALLOWLIST_USER_ID || '123456789';
process.env.MODEL_API_KEY = process.env.MODEL_API_KEY || 'test-key-for-self-test';
process.env.MODEL_NAME = process.env.MODEL_NAME || 'anthropic/claude-sonnet-4';
process.env.OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
process.env.TRANSCRIPTION_MOCK_MODE = 'true';
process.env.TTS_MOCK_MODE = 'true';
process.env.VECTOR_DB_MOCK_MODE = 'true';
process.env.NODE_ENV = 'test';

import { getEnv, maskSecret } from '../src/config/env';
import { loadSoulPrompt, loadCoreMemory, appendMemoryLog } from '../src/memory/core.memory';
import { storeMemory, recallMemories, getMockStoreSize } from '../src/memory/vector.service';
import { transcribeAudio } from '../src/transcription/transcriber';
import { textToSpeech, cleanupTempFile } from '../src/tts/tts.service';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve(fn())
    .then(() => {
      console.log(`  ✅ ${name}`);
      passed++;
    })
    .catch((error: Error) => {
      console.log(`  ❌ ${name}: ${error.message}`);
      failed++;
    });
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function runTests(): Promise<void> {
  console.log('\n🧪 Agent Claw — Self Test\n');
  console.log('━'.repeat(50));

  // 1. Environment
  console.log('\n📋 Environment Tests:');
  await test('Env variables load correctly', () => {
    const env = getEnv();
    assert(typeof env.TELEGRAM_BOT_TOKEN === 'string', 'Token should be string');
    assert(env.TELEGRAM_BOT_TOKEN.length > 0, 'Token should not be empty');
  });

  await test('Secret masking works', () => {
    const masked = maskSecret('sk-1234567890abcdef');
    assert(!masked.includes('1234567890'), 'Secret should be masked');
    assert(masked.includes('****'), 'Should contain mask characters');
  });

  // 2. Soul & Memory
  console.log('\n🧠 Memory Tests:');
  await test('Soul prompt loads', () => {
    const soul = loadSoulPrompt();
    assert(soul.length > 0, 'Soul should not be empty');
    assert(soul.includes('Agent Claw'), 'Should mention Agent Claw');
  });

  await test('Core memory loads', () => {
    const memory = loadCoreMemory();
    assert(typeof memory === 'string', 'Should return string');
  });

  await test('Memory log appends', () => {
    appendMemoryLog('Test entry from self-test');
    const logPath = path.resolve(process.cwd(), 'memory', 'memory_log.md');
    const content = fs.readFileSync(logPath, 'utf-8');
    assert(content.includes('Test entry from self-test'), 'Log should contain test entry');
  });

  // 3. Vector Memory (Mock)
  console.log('\n🗃️ Vector Memory Tests (Mock):');
  await test('Store memory', async () => {
    const id = await storeMemory('Kullanıcı kahveyi sütlü sever', 'test-user', 'test');
    assert(id.length > 0, 'Should return an ID');
  });

  await test('Recall memory', async () => {
    const results = await recallMemories('kahve');
    assert(results.length > 0, 'Should find at least 1 result');
    assert(results[0].text.includes('kahve'), 'Result should contain query');
  });

  await test('Mock store has entries', () => {
    assert(getMockStoreSize() > 0, 'Mock store should have entries');
  });

  // 4. Transcription (Mock)
  console.log('\n🎤 Transcription Tests (Mock):');
  await test('Mock transcription works', async () => {
    const result = await transcribeAudio('/fake/path/test.ogg');
    assert(result.text.length > 0, 'Should return transcription text');
    assert(result.text.includes('Mock'), 'Should be mock result');
  });

  // 5. TTS (Mock)
  console.log('\n🔊 TTS Tests (Mock):');
  await test('Mock TTS generates file', async () => {
    const outputPath = await textToSpeech('Test mesajı');
    assert(fs.existsSync(outputPath), 'Audio file should exist');
    cleanupTempFile(outputPath);
    assert(!fs.existsSync(outputPath), 'File should be cleaned up');
  });

  // Results
  console.log('\n' + '━'.repeat(50));
  console.log(`\n📊 Sonuçlar: ${passed} başarılı, ${failed} başarısız`);

  if (failed === 0) {
    console.log('🎉 Tüm testler geçti! Agent Claw hazır.\n');
  } else {
    console.log('⚠️ Bazı testler başarısız oldu. Yukarıdaki hataları kontrol edin.\n');
    process.exit(1);
  }
}

runTests();
