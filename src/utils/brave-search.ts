import { safeLog, safeError } from './logger';

export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

export async function searchBrave(query: string): Promise<BraveSearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    safeLog('Brave Search API Key missing, falling back to legacy search logic or returning empty');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();

    if (!data.web || !data.web.results) {
      return [];
    }

    return data.web.results.map((r: any) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    }));
  } catch (error) {
    safeError('Brave Search Error', error);
    return [];
  }
}
