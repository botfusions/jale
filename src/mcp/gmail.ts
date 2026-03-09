/**
 * MCP — Gmail via gogcli
 * Uses gogcli (gog.exe) for Gmail read-only operations.
 * READ-ONLY: Never send, delete, or modify emails.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { safeLog, safeError } from '../utils/logger';

// Google API client will be used here instead of gogcli
// import { google } from 'googleapis';

export interface EmailSummary {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  unread: boolean;
}

async function runGoogleQuery(query: string): Promise<any[]> {
  // Placeholder for future implementation using googleapis or clasp run
  safeLog('Google query executed (Mock/Placeholder)', { query });
  return [];
}

export async function getUnreadEmails(maxResults: number = 5): Promise<EmailSummary[]> {
  try {
    safeLog('Fetching unread emails via Google API (Placeholder)');
    // This will be implemented with googleapis in the next step
    return [];
  } catch (error) {
    safeError('Failed to fetch unread emails', error);
    return [];
  }
}

export function formatEmailSummary(
  emails: EmailSummary[],
  title: string = '📧 E-postalar'
): string {
  if (emails.length === 0) {
    return `${title}\n\n✨ Sonuç yok.`;
  }

  const lines = emails.map((e, i) => {
    const unreadBadge = e.unread ? '🔴 ' : '';
    const from = e.from ? `**${e.from}**` : 'Bilinmeyen';
    const snippet = e.snippet ? `\n   _${e.snippet.substring(0, 80)}..._` : '';
    return `${i + 1}. ${unreadBadge}${from}\n   📌 ${e.subject}${snippet}`;
  });

  return `${title} (${emails.length} sonuç)\n\n${lines.join('\n\n')}`;
}
