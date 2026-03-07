import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

const EXTERNAL_URL = 'https://qdrant.turklawai.com';
const INTERNAL_URL = 'http://qdrant:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

async function testUrl(label: string, url: string) {
  console.log(`\n--- Testing ${label}: ${url} ---`);
  try {
    const start = Date.now();
    const res = await fetch(`${url}/healthz`, {
      signal: AbortSignal.timeout(3000)
    });
    const duration = Date.now() - start;
    console.log(`Status: ${res.status} (${duration}ms)`);
    return res.ok;
  } catch (err: any) {
    console.log(`Connection Failed: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('=== Qdrant VPS Internal/External Network Test ===');
  
  await testUrl('External URL', EXTERNAL_URL);
  await testUrl('Internal Docker URL', INTERNAL_URL);
  
  console.log('\n--- Collection List Attempt ---');
  // We try listing collections on both if reachable
  const urlsToTry = [EXTERNAL_URL, INTERNAL_URL];
  for (const url of urlsToTry) {
    try {
      const res = await fetch(`${url}/collections`, {
        headers: { 'api-key': QDRANT_API_KEY || '' },
        signal: AbortSignal.timeout(3000)
      });
      console.log(`Auth test on ${url}: Status ${res.status}`);
      if (res.ok) {
        const data: any = await res.json();
        console.log(`Collections found: ${data.result.collections.length}`);
      }
    } catch (e) {}
  }
}

run();
