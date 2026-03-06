/**
 * MCP — Google Calendar via gogcli
 * Uses gogcli (gog.exe) for calendar operations.
 * READ-ONLY: Never create, edit, or delete events.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { safeLog, safeError } from '../utils/logger';

// Google API client will be used here instead of gogcli
// import { google } from 'googleapis';

export interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  location?: string;
  status?: string;
}

async function runGoogleCalendarQuery(): Promise<any[]> {
  // Placeholder for future implementation using googleapis
  safeLog('Google Calendar query executed (Mock/Placeholder)');
  return [];
}


export async function getTodayEvents(): Promise<CalendarEvent[]> {
  try {
    safeLog('Fetching today events via Google API (Placeholder)');
    return [];
  } catch (error) {
    safeError('Failed to fetch today events', error);
    return [];
  }
}

export async function getTomorrowEvents(): Promise<CalendarEvent[]> {
  try {
    safeLog('Fetching tomorrow events via Google API (Placeholder)');
    return [];
  } catch (error) {
    safeError('Failed to fetch tomorrow events', error);
    return [];
  }
}

export async function getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
  try {
    safeLog('Fetching upcoming events via Google API (Placeholder)', { days });
    return [];
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
