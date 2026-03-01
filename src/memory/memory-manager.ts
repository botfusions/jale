import fs from 'fs';
import path from 'path';
import { safeLog, safeError } from '../utils/logger';

export interface MemoryItem {
  id: string;
  text: string;
  timestamp: string;
  userId: string;
  source: string;
}

const MEMORY_DIR = path.resolve(process.cwd(), 'data_memory', 'active_memory');
const ARCHIVE_DIR = path.resolve(process.cwd(), 'data_memory', 'archive');
const MEMORY_FILE = path.join(MEMORY_DIR, 'memories.json');

export class MemoryManager {
  private static instance: MemoryManager;
  private memories: MemoryItem[] = [];

  private constructor() {
    this.ensureDirectories();
    this.loadMemories();
    this.archiveOldMemories();
  }

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
    if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }

  private loadMemories(): void {
    try {
      if (fs.existsSync(MEMORY_FILE)) {
        const data = fs.readFileSync(MEMORY_FILE, 'utf-8');
        this.memories = JSON.parse(data);
      }
    } catch (error) {
      safeError('Failed to load memories', error);
      this.memories = [];
    }
  }

  private saveMemories(): void {
    try {
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(this.memories, null, 2), 'utf-8');
    } catch (error) {
      safeError('Failed to save memories', error);
    }
  }

  public addMemory(item: MemoryItem): void {
    this.memories.push(item);
    this.saveMemories();
    // Her eklemede bir kontrol yapalım (isteğe bağlı, performansa göre ayarlanabilir)
    this.archiveOldMemories();
  }

  public getAllActive(): MemoryItem[] {
    return this.memories;
  }

  /**
   * 4 günden eski verileri arşive taşır
   */
  public archiveOldMemories(): void {
    const now = new Date();
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    const active: MemoryItem[] = [];
    const toArchive: MemoryItem[] = [];

    for (const item of this.memories) {
      const itemDate = new Date(item.timestamp);
      if (itemDate >= fourDaysAgo) {
        active.push(item);
      } else {
        toArchive.push(item);
      }
    }

    if (toArchive.length > 0) {
      this.memories = active;
      this.saveMemories();
      this.writeToArchive(toArchive);
      safeLog(`Archived ${toArchive.length} old memories`);
    }
  }

  private writeToArchive(items: MemoryItem[]): void {
    const dateStr = new Date().toISOString().split('T')[0];
    const archiveFile = path.join(ARCHIVE_DIR, `archive_${dateStr}.json`);
    
    let existingArchive: MemoryItem[] = [];
    if (fs.existsSync(archiveFile)) {
      try {
        existingArchive = JSON.parse(fs.readFileSync(archiveFile, 'utf-8'));
      } catch {
        existingArchive = [];
      }
    }

    const updatedArchive = [...existingArchive, ...items];
    fs.writeFileSync(archiveFile, JSON.stringify(updatedArchive, null, 2), 'utf-8');
  }

  public search(query: string, limit: number = 10): MemoryItem[] {
    const queryLower = query.toLowerCase();
    return this.memories
      .filter(m => m.text.toLowerCase().includes(queryLower))
      .slice(0, limit);
  }
}
