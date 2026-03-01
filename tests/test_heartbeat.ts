import { startHeartbeat, sendHeartbeatNow } from '../src/scheduler/heartbeat';
import { Bot } from 'grammy';
import { safeLog } from '../src/utils/logger';

// Mock Bot for testing
const mockBot = {
  api: {
    sendMessage: async (chatId: number, text: string, options: any) => {
      console.log('--- MOCK TELEGRAM SEND ---');
      console.log(`To: ${chatId}`);
      console.log(`Message:\n${text}`);
      console.log('--------------------------');
      return { message_id: 123 } as any;
    }
  }
} as unknown as Bot;

async function testBriefing() {
  console.log('🚀 Starting Manual Briefing Test...');
  try {
    await sendHeartbeatNow(mockBot);
    console.log('✅ Test Completed Successfully.');
  } catch (err) {
    console.error('❌ Test Failed:', err);
  }
}

testBriefing();
