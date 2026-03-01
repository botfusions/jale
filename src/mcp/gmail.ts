/**
 * MCP — Gmail via gogcli
 * Uses gogcli (gog.exe) for Gmail read-only operations.
 * READ-ONLY: Never send, delete, or modify emails.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { safeLog, safeError } from '../utils/logger';

const execFileAsync = promisify(execFile);

const GOG_BIN = path.resolve(process.cwd(), 'gogcli', 'bin', 'gog.exe');

interface EmailSummary {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  unread: boolean;
}

async function runGog(args: string[]): Promise<string> {
  try {
    const { stdout, stderr } = await execFileAsync(GOG_BIN, [...args, '--json'], {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });
    if (stderr) {
      safeLog('gogcli gmail stderr', { stderr: stderr.substring(0, 200) });
    }
    return stdout;
  } catch (error) {
    safeError('gogcli gmail execution failed', error);
    throw error;
  }
}

export async function getUnreadEmails(maxResults: number = 5): Promise<EmailSummary[]> {
  try {
    const output = await runGog(['gmail', 'search', 'is:unread', '--limit', maxResults.toString()]);
    const data = JSON.parse(output);
    const messages: EmailSummary[] = (data.threads || data.messages || []).map((m: any) => ({
      id: m.id || '',
      from: m.from || m.sender || '',
      subject: m.subject || 'Konu yok',
      date: m.date || m.internalDate || '',
      snippet: m.snippet || '',
      unread: true,
    }));
    safeLog('Unread emails fetched', { count: messages.length });
    return messages;
  } catch (error) {
    safeError('Failed to fetch unread emails', error);
    return [];
  }
}

export async function searchEmails(query: string, maxResults: number = 5): Promise<EmailSummary[]> {
  try {
    const output = await runGog(['gmail', 'search', query, '--limit', maxResults.toString()]);
    const data = JSON.parse(output);
    const messages: EmailSummary[] = (data.threads || data.messages || []).map((m: any) => ({
      id: m.id || '',
      from: m.from || m.sender || '',
      subject: m.subject || 'Konu yok',
      date: m.date || m.internalDate || '',
      snippet: m.snippet || '',
      unread: m.labelIds?.includes('UNREAD') || false,
    }));
    safeLog('Email search completed', { query, count: messages.length });
    return messages;
  } catch (error) {
    safeError('Failed to search emails', error);
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
