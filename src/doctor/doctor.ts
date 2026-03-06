/**
 * Doctor — Agent Claw Self-Healing & Diagnostics
 *
 * Checks all services, detects issues, and attempts auto-fixes.
 * Triggered via /doctor command or runs periodically.
 */

import { getEnv } from '../config/env';
import { safeLog, safeError } from '../utils/logger';
import { metrics } from '../utils/metrics';
import fs from 'fs';
import path from 'path';

export interface HealthCheck {
  name: string;
  status: 'ok' | 'warn' | 'fail';
  message: string;
  autoFixed?: boolean;
  fixAction?: string;
}

/**
 * Run all health checks
 */
export async function runDiagnostics(): Promise<HealthCheck[]> {
  const results: HealthCheck[] = [];

  // 1. Environment variables
  results.push(await checkEnvVars());

  // 2. LLM API connectivity
  results.push(await checkLLM());

  // 3. ElevenLabs TTS
  results.push(await checkElevenLabs());

  // 4. OpenAI TTS / Transcription
  results.push(await checkOpenAI());

  // 5. Temp directory
  results.push(await checkTempDir());

  // 6. Memory system
  results.push(await checkMemory());

  // 7. Disk space (temp files)
  results.push(await checkTempFiles());

  // 8. Google Workspace CLI
  results.push(await checkGoogleCli());

  // 9. Summarize CLI
  results.push(await checkSummarize());

  // 10. System Metrics
  results.push(checkSystemMetrics());

  safeLog('Doctor diagnostics completed', {
    total: results.length,
    ok: results.filter((r) => r.status === 'ok').length,
    warn: results.filter((r) => r.status === 'warn').length,
    fail: results.filter((r) => r.status === 'fail').length,
    autoFixed: results.filter((r) => r.autoFixed).length,
  });

  return results;
}

/**
 * Check critical environment variables
 */
async function checkEnvVars(): Promise<HealthCheck> {
  try {
    const env = getEnv();
    const missing: string[] = [];

    // Kritik değişkenler
    if (!env.TELEGRAM_BOT_TOKEN) missing.push('TELEGRAM_BOT_TOKEN');
    if (!env.MODEL_API_KEY) missing.push('MODEL_API_KEY');

    if (missing.length > 0) {
      return { name: '🔑 Env Vars', status: 'fail', message: `Kritik eksik: ${missing.join(', ')}` };
    }

    // Opsiyonel ama önemli değişkenler
    const warnings: string[] = [];
    if (!env.ELEVENLABS_API_KEY) warnings.push('ELEVENLABS_API_KEY');
    if (!env.TRANSCRIPTION_API_KEY) warnings.push('TRANSCRIPTION_API_KEY');
    if (!env.OPENWEATHERMAP_API_KEY) warnings.push('OPENWEATHERMAP_API_KEY');

    if (warnings.length > 0) {
      return {
        name: '🔑 Env Vars',
        status: 'warn',
        message: `Bazı özellikler kısıtlı olabilir (Eksik: ${warnings.join(', ')})`,
      };
    }

    return { name: '🔑 Env Vars', status: 'ok', message: 'Tüm temel değişkenler yapılandırıldı' };
  } catch (error) {
    return { name: '🔑 Env Vars', status: 'fail', message: 'Yapılandırma yüklenemedi' };
  }
}

/**
 * Check LLM API (OpenRouter)
 */
async function checkLLM(): Promise<HealthCheck> {
  try {
    const env = getEnv();
    const response = await fetch(`${env.OPENROUTER_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${env.MODEL_API_KEY}` },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      return { name: '🤖 LLM (OpenRouter)', status: 'ok', message: 'Bağlantı başarılı' };
    }
    return { name: '🤖 LLM (OpenRouter)', status: 'fail', message: `HTTP ${response.status}` };
  } catch (error: any) {
    return {
      name: '🤖 LLM (OpenRouter)',
      status: 'fail',
      message: error.message?.substring(0, 80) || 'Bağlantı hatası',
    };
  }
}

/**
 * Check ElevenLabs TTS API
 */
async function checkElevenLabs(): Promise<HealthCheck> {
  try {
    const env = getEnv();
    if (!env.ELEVENLABS_API_KEY) {
      return {
        name: '🔊 ElevenLabs',
        status: 'warn',
        message: 'API key yok — OpenAI fallback aktif',
      };
    }

    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': env.ELEVENLABS_API_KEY },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = (await response.json()) as any;
      const chars = data?.subscription?.character_count || 0;
      const limit = data?.subscription?.character_limit || 0;
      const remaining = limit - chars;
      const pct = limit > 0 ? Math.round((remaining / limit) * 100) : 0;

      if (remaining < 500) {
        return {
          name: '🔊 ElevenLabs',
          status: 'warn',
          message: `Kredi azaldı: ${remaining}/${limit} (${pct}%)`,
        };
      }
      return {
        name: '🔊 ElevenLabs',
        status: 'ok',
        message: `Kredi: ${remaining.toLocaleString()}/${limit.toLocaleString()} (${pct}%)`,
      };
    }
    return { name: '🔊 ElevenLabs', status: 'fail', message: `HTTP ${response.status}` };
  } catch (error: any) {
    return {
      name: '🔊 ElevenLabs',
      status: 'warn',
      message: 'Bağlantı hatası — OpenAI fallback aktif',
    };
  }
}

/**
 * Check OpenAI API (transcription + TTS fallback)
 */
async function checkOpenAI(): Promise<HealthCheck> {
  try {
    const env = getEnv();
    if (!env.TRANSCRIPTION_API_KEY) {
      return {
        name: '🎤 OpenAI (Whisper)',
        status: 'warn',
        message: 'API key yok — ses tanıma çalışmaz',
      };
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${env.TRANSCRIPTION_API_KEY}` },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      return { name: '🎤 OpenAI (Whisper)', status: 'ok', message: 'Bağlantı başarılı' };
    }
    if (response.status === 401) {
      return { name: '🎤 OpenAI (Whisper)', status: 'fail', message: 'API key geçersiz!' };
    }
    return { name: '🎤 OpenAI (Whisper)', status: 'warn', message: `HTTP ${response.status}` };
  } catch (error: any) {
    return { name: '🎤 OpenAI (Whisper)', status: 'warn', message: 'Bağlantı hatası' };
  }
}

/**
 * Check and fix temp directory
 */
async function checkTempDir(): Promise<HealthCheck> {
  const tmpDir = path.resolve(process.cwd(), 'tmp');
  try {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
      return {
        name: '📁 Temp Dizini',
        status: 'ok',
        message: 'Oluşturuldu',
        autoFixed: true,
        fixAction: 'mkdir tmp',
      };
    }
    return { name: '📁 Temp Dizini', status: 'ok', message: 'Mevcut' };
  } catch (error) {
    return { name: '📁 Temp Dizini', status: 'fail', message: 'Oluşturulamadı' };
  }
}

/**
 * Check memory system (Qdrant)
 */
async function checkMemory(): Promise<HealthCheck> {
  const env = getEnv();
  if (env.VECTOR_DB_MOCK_MODE) {
    return { name: '🧠 Hafıza', status: 'warn', message: 'Mock mod — Qdrant bağlı değil' };
  }
  if (!env.QDRANT_URL) {
    return { name: '🧠 Hafıza', status: 'fail', message: 'Qdrant URL eksik' };
  }

  try {
    // Ham HTTP health check
    const baseUrl = env.QDRANT_URL.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/healthz`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return { 
        name: '🧠 Hafıza', 
        status: 'ok', 
        message: `Qdrant aktif (${env.QDRANT_COLLECTION})` 
      };
    }
    return { 
      name: '🧠 Hafıza', 
      status: 'fail', 
      message: `Qdrant VPS hatası: HTTP ${response.status}` 
    };
  } catch (error: any) {
    return { 
      name: '🧠 Hafıza', 
      status: 'fail', 
      message: `Bağlantı hatası: ${error.message?.substring(0, 50)}` 
    };
  }
}

/**
 * Check and clean orphaned temp files
 */
async function checkTempFiles(): Promise<HealthCheck> {
  const tmpDir = path.resolve(process.cwd(), 'tmp');
  try {
    if (!fs.existsSync(tmpDir)) {
      return { name: '🧹 Temp Dosyalar', status: 'ok', message: 'Temiz' };
    }

    const files = fs.readdirSync(tmpDir);
    const staleFiles = files.filter((f) => {
      const filePath = path.join(tmpDir, f);
      const stat = fs.statSync(filePath);
      const ageMs = Date.now() - stat.mtimeMs;
      return ageMs > 30 * 60 * 1000; // 30 min old
    });

    if (staleFiles.length > 0) {
      // Auto-fix: delete stale temp files
      for (const f of staleFiles) {
        try {
          fs.unlinkSync(path.join(tmpDir, f));
        } catch {
          /* ignore */
        }
      }
      return {
        name: '🧹 Temp Dosyalar',
        status: 'ok',
        message: `${staleFiles.length} eski dosya temizlendi`,
        autoFixed: true,
        fixAction: `Deleted ${staleFiles.length} stale files`,
      };
    }

    return { name: '🧹 Temp Dosyalar', status: 'ok', message: `${files.length} dosya (temiz)` };
  } catch (error) {
    return { name: '🧹 Temp Dosyalar', status: 'warn', message: 'Kontrol edilemedi' };
  }
}

/**
 * Check summarize CLI
 */
async function checkSummarize(): Promise<HealthCheck> {
  try {
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);
    const { stdout } = await execFileAsync('npx', ['-y', '@steipete/summarize', '--version'], {
      timeout: 15000,
      shell: true,
    });
    const version = stdout.trim();
    return { name: '📝 Summarize', status: 'ok', message: `v${version}` };
  } catch {
    return { name: '📝 Summarize', status: 'warn', message: 'Kurulu değil — /ozet çalışmaz' };
  }
}

/**
 * Check Google Workspace CLI (clasp)
 */
async function checkGoogleCli(): Promise<HealthCheck> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    // Check if clasp is installed
    const { stdout } = await execAsync('npx clasp --version', { timeout: 10000 });
    const version = stdout.trim();
    
    return { 
      name: '🌐 Google CLI', 
      status: 'ok', 
      message: `clasp v${version} aktif` 
    };
  } catch (error: any) {
    return { 
      name: '🌐 Google CLI', 
      status: 'warn', 
      message: 'clasp kurulu değil veya erişilemiyor' 
    };
  }
}

/**
 * Check system metrics
 */
function checkSystemMetrics(): HealthCheck {
  const m = metrics.getMetrics();

  let status: 'ok' | 'warn' | 'fail' = 'ok';

  if (parseFloat(m.errorRate) > 10) {
    status = 'warn';
  }

  if (parseFloat(m.errorRate) > 30) {
    status = 'fail';
  }

  const message = `Çağrı: ${m.apiCalls} | Hata Oranı: %${m.errorRate} | Ort. Yanıt: ${m.avgResponseTimeMs}ms`;

  return {
    name: '📈 Sistem Metrikleri',
    status,
    message,
  };
}

/**
 * Format diagnostics for Telegram
 */
export function formatDiagnostics(results: HealthCheck[]): string {
  const statusIcons = { ok: '✅', warn: '⚠️', fail: '❌' };
  const ok = results.filter((r) => r.status === 'ok').length;
  const warn = results.filter((r) => r.status === 'warn').length;
  const fail = results.filter((r) => r.status === 'fail').length;
  const fixed = results.filter((r) => r.autoFixed).length;

  let overall = '🟢';
  if (fail > 0) overall = '🔴';
  else if (warn > 0) overall = '🟡';

  const lines = results.map((r) => {
    let line = `${statusIcons[r.status]} ${r.name}: ${r.message}`;
    if (r.autoFixed) line += ' 🔧';
    return line;
  });

  const header = `${overall} **Agent Claw Doktor Raporu**\n_${new Date().toLocaleString('tr-TR')}_\n`;
  const summary = `\n📊 **Özet:** ${ok} OK · ${warn} Uyarı · ${fail} Hata${fixed > 0 ? ` · ${fixed} Otomatik Düzeltme 🔧` : ''}`;

  return `${header}\n${lines.join('\n')}\n${summary}`;
}
