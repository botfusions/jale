import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION = process.env.QDRANT_COLLECTION;

async function checkQdrant() {
  console.log(`URL: ${QDRANT_URL}`);
  console.log(`Collection: ${COLLECTION}`);
  console.log(`Key length: ${QDRANT_API_KEY?.length}`);

  const testHeaders = async (name: string, headers: any) => {
    console.log(`\n--- Testing ${name} ---`);
    try {
      const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`, { headers });
      const text = await res.text();
      console.log(`Status: ${res.status}`);
      console.log(`Response: ${text.substring(0, 100)}`);
      if (res.ok) {
        try {
          return JSON.parse(text);
        } catch (e) {
          return text;
        }
      }
    } catch (e: any) {
      console.log(`Error: ${e.message}`);
    }
    return null;
  };

  // Try standard api-key
  await testHeaders('api-key header', {
    'Content-Type': 'application/json',
    'api-key': QDRANT_API_KEY || '',
  });

  // Try Bearer token
  await testHeaders('Authorization Bearer header', {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${QDRANT_API_KEY}`,
  });
}

checkQdrant();
