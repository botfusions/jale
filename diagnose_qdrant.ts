import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

async function diagnose() {
  console.log('--- Qdrant Connection Diagnosis ---');
  console.log(`Target URL: ${QDRANT_URL}`);

  try {
    const start = Date.now();
    const res = await fetch(`${QDRANT_URL}/healthz`, {
      signal: AbortSignal.timeout(5000),
    });
    const duration = Date.now() - start;

    console.log(`HTTP Status: ${res.status}`);
    console.log(`Response Time: ${duration}ms`);

    if (res.ok) {
      const text = await res.text();
      console.log('Ping Success: Qdrant is reachable.');
    } else {
      console.log('Ping Failed: Server responded but with an error status.');
    }
  } catch (err: any) {
    console.error('Connection Failed: Could not reach the server at all.');
    console.error(`Reason: ${err.message}`);

    if (err.message.includes('ENOTFOUND') || err.message.includes('EAI_AGAIN')) {
      console.log('DNS Error: The domain name does not resolve.');
    } else if (err.message.includes('ECONNREFUSED')) {
      console.log('Network Error: The port is closed or the firewall is blocking it.');
    }
  }

  console.log('\n--- Credential Check ---');
  try {
    const res = await fetch(`${QDRANT_URL}/collections`, {
      headers: { 'api-key': QDRANT_API_KEY || '' },
    });
    if (res.status === 401) {
      console.log('Auth Failure: The API Key in .env is INVALID.');
    } else if (res.ok) {
      console.log('Auth Success: API Key is VALID.');
    } else {
      console.log(`Unexpected Status: ${res.status}`);
    }
  } catch (e) {
    console.log('Could not perform Auth check due to network error.');
  }
}

diagnose();
