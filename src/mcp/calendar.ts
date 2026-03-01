/**
 * MCP — Google Calendar via gogcli
 * Uses gogcli (gog.exe) for calendar operations.
 * READ-ONLY: Never create, edit, or delete events.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { safeLog, safeError } from '../utils/logger';

const execFileAsync = promisify(execFile);

// gogcli binary path
const GOG_BIN = path.resolve(process.cwd(), 'gogcli', 'bin', 'gog.exe');

interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  location?: string;
  status?: string;
}

async function runGog(args: string[]): Promise<string> {
  try {
    const { stdout, stderr } = await execFileAsync(GOG_BIN, [...args, '--json'], {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });
    if (stderr) {
      safeLog('gogcli stderr', { stderr: stderr.substring(0, 200) });
    }
    return stdout;
  } catch (error) {
    safeError('gogcli execution failed', error);
    throw error;
  }
}

export async function getTodayEvents(): Promise<CalendarEvent[]> {
  try {
    const output = await runGog(['calendar', 'today']);
    const data = JSON.parse(output);
    const events: CalendarEvent[] = (data.events || []).map((e: any) => ({
      summary: e.summary || 'Başlıksız',
      start: e.start?.dateTime || e.start?.date || '',
      end: e.end?.dateTime || e.end?.date || '',
      location: e.location || '',
      status: e.status || '',
    }));
    safeLog('Calendar events fetched', { count: events.length });
    return events;
  } catch (error) {
    safeError('Failed to fetch today events', error);
    return [];
  }
}

export async function getTomorrowEvents(): Promise<CalendarEvent[]> {
  try {
    const output = await runGog(['calendar', 'tomorrow']);
    const data = JSON.parse(output);
    const events: CalendarEvent[] = (data.events || []).map((e: any) => ({
      summary: e.summary || 'Başlıksız',
      start: e.start?.dateTime || e.start?.date || '',
      end: e.end?.dateTime || e.end?.date || '',
      location: e.location || '',
      status: e.status || '',
    }));
    safeLog('Calendar tomorrow events fetched', { count: events.length });
    return events;
  } catch (error) {
    safeError('Failed to fetch tomorrow events', error);
    return [];
  }
}

export async function getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
  try {
    const output = await runGog(['calendar', 'list', '--days', days.toString()]);
    const data = JSON.parse(output);
    const events: CalendarEvent[] = (data.events || []).map((e: any) => ({
      summary: e.summary || 'Başlıksız',
      start: e.start?.dateTime || e.start?.date || '',
      end: e.end?.dateTime || e.end?.date || '',
      location: e.location || '',
      status: e.status || '',
    }));
    safeLog('Calendar upcoming events fetched', { count: events.length, days });
    return events;
  } catch (error) {
    safeError('Failed to fetch upcoming events', error);
    return [];
  }
}

export function formatCalendarSummary(
  events: CalendarEvent[],
  title: string = '📅 Takvim'
): string {
  if (events.length === 0) {
    return `${title}\n\n✨ Etkinlik yok — takvim boş!`;
  }

  const lines = events.map((e, i) => {
    const time = formatTime(e.start);
    const loc = e.location ? ` 📍 ${e.location}` : '';
    return `${i + 1}. **${time}** — ${e.summary}${loc}`;
  });

  return `${title} (${events.length} etkinlik)\n\n${lines.join('\n')}`;
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '⏰ ?';
  try {
    const d = new Date(dateStr);
    if (dateStr.length <= 10) return d.toLocaleDateString('tr-TR'); // All-day
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}
