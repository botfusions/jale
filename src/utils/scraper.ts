import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import { safeLog, safeError } from './logger';

const execPromise = promisify(exec);

export interface ScrapeResult {
  status: 'success' | 'error';
  url: string;
  title?: string;
  content?: string;
  message?: string;
}

export async function scrapeWithScrapling(url: string): Promise<ScrapeResult> {
  const scriptPath = path.join(process.cwd(), 'scripts', 'scraper.py');
  
  try {
    safeLog('Launching Scrapling Python script', { url });
    
    // Command to run python script
    // Note: Using 'python' or 'python3' depending on environment
    const command = `python "${scriptPath}" "${url}"`;
    const { stdout, stderr } = await execPromise(command);

    if (stderr && !stdout) {
      throw new Error(stderr);
    }

    const result: ScrapeResult = JSON.parse(stdout);
    return result;
  } catch (error: any) {
    safeError('Scrapling Execution Error', error);
    return {
      status: 'error',
      url,
      message: error.message
    };
  }
}
