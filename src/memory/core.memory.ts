import fs from 'fs';
import path from 'path';
import { safeLog } from '../utils/logger';

const SOUL_PATH = path.resolve(process.cwd(), 'data_memory', 'soul.md');
const CORE_MEMORY_PATH = path.resolve(process.cwd(), 'data_memory', 'core_memory.md');
const MEMORY_LOG_PATH = path.resolve(process.cwd(), 'data_memory', 'memory_log.md');

export function loadSoulPrompt(): string {
  try {
    if (fs.existsSync(SOUL_PATH)) {
      return fs.readFileSync(SOUL_PATH, 'utf-8');
    }
  } catch {
    safeLog('soul.md could not be loaded, using default');
  }
  return 'You are Agent Claw, a helpful and concise AI assistant. Be friendly but not robotic. Always propose next steps.';
}

export function loadCoreMemory(): string {
  try {
    if (fs.existsSync(CORE_MEMORY_PATH)) {
      return fs.readFileSync(CORE_MEMORY_PATH, 'utf-8');
    }
  } catch {
    safeLog('core_memory.md could not be loaded');
  }
  return '';
}

export function appendMemoryLog(entry: string): void {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `\n## ${timestamp}\n${entry}\n`;

    // Ensure directory exists
    const dir = path.dirname(MEMORY_LOG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.appendFileSync(MEMORY_LOG_PATH, logEntry, 'utf-8');
    safeLog('Memory log entry appended');
  } catch (error) {
    safeLog('Failed to append memory log');
  }
}
