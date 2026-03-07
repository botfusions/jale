import { recallMemories } from './src/memory/vector.service';
import { safeLog } from './src/utils/logger';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkMustang() {
  console.log('Checking for Mustang memories...');
  // We don't have the user's ID here, but let's try searching globally by omitting the filter or using common test IDs if we can find them.
  // Actually, I'll check the collection stats first.
  const memories = await recallMemories('Mustang', '7238426021'); // Attempting with a likely ID or just searching
  console.log('Found memories:', JSON.stringify(memories, null, 2));
}

checkMustang().catch(console.error);
