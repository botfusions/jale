import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION = process.env.QDRANT_COLLECTION;

async function checkQdrant() {
  console.log(`Querying Qdrant: ${QDRANT_URL}/collections/${COLLECTION}`);

  const headers = {
    'Content-Type': 'application/json',
    'api-key': QDRANT_API_KEY || '',
  };

  try {
    // 1. Check collection info
    const infoRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`, { headers });
    const info = await infoRes.json();
    console.log('Collection Info:', JSON.stringify(info, null, 2));

    // 2. Scroll points (to see recent entries)
    const scrollRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points/scroll`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        limit: 10,
        with_payload: true,
      }),
    });
    const scroll = await scrollRes.json();
    console.log('Recent Points:', JSON.stringify(scroll, null, 2));

    // 3. Search for "Mustang" globally (no filter)
    // We need an embedding for this, but maybe we can just scroll and find it.
  } catch (error) {
    console.error('Error querying Qdrant:', error);
  }
}

checkQdrant();
