import { chat, LLMMessage, LLMResponse } from '../llm/openrouter';
import { safeLog, safeError } from '../utils/logger';
import { spawn } from 'child_process';
import * as path from 'path';

export class BorsaciAgent {
  private name: string = 'KAYA';

  constructor() {}

  // Built-in tool execution for the agent to call the Python wrapper
  private async executeMcpQuery(query: string): Promise<string> {
    return new Promise((resolve) => {
      const borsaciDir = path.join(process.cwd(), 'borsaci');

      // Güvenli: Argümanları ayrı ayrı geçerek command injection'i önle
      const child = spawn('uv', ['run', 'python', 'run_query.py', query], {
        cwd: borsaciDir,
        shell: false // Güvenlik: shell'i kullanma
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data;
      });

      child.stderr?.on('data', (data) => {
        stderr += data;
      });

      child.on('error', (error) => {
        const errMsg = error.message;
        if (errMsg.includes('credentials') || errMsg.includes('missing api key') || errMsg.includes('OPENROUTER_API_KEY')) {
          resolve(`ERROR: Borsacı yetkilendirme (Auth) hatası.\nTerminal Çıktısı: ${errMsg}`);
        } else {
          resolve(`ERROR: Hata oluştu: ${errMsg}`);
        }
      });

      child.on('close', (code: number | null) => {
        if (code !== 0 && !stderr) {
          resolve(`ERROR: Process exited with code ${code}`);
        } else {
          resolve(stdout || "Sonuç bulunamadı.");
        }
      });
    });
  }

  public async analyzeMarket(query: string, history: LLMMessage[] = []): Promise<LLMResponse> {
    safeLog(`${this.name} analyzing market request with model moonshotai/kimi-k2.5`);

    const systemPrompt = `
You are KAYA, the Specialist Financial Analyst and Trader (Borsacı) of the Agent Swarm.
Your primary role is to analyze stock markets, perform crypto analysis, and generate financial reports.
- You must always respond in Turkish.
- You have access to a specific financial tool (Borsaci MCP system). 
- Use the tool to request raw data or preliminary analysis, then synthesize it professionally for the CEO or User.
- Speak in a professional, confident, and analytical tone.
- Your designated LLM is 'moonshotai/kimi-k2.5'.
    `.trim();

    const tools = [
      {
        type: 'function',
        function: {
          name: 'get_market_analysis',
          description: 'Fetches real-time market data, company briefs, and analysis via the Borsaci MCP system.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The exact financial query to run (e.g., "ASELS hissesi için analiz", "Bitcoin son durum").',
              },
            },
            required: ['query'],
          },
        },
      },
    ];

    // First call to kimi-k2.5 to see if it needs the tool
    let response = await chat(query, history, `Role: Financial Analyst (KAYA)\n${systemPrompt}`, tools, 'moonshotai/kimi-k2.5');

    if (response.tool_calls && response.tool_calls.length > 0) {
      safeLog('BorsaciAgent Tool Call Initiated', { calls: response.tool_calls.length });

      const currentHistory: LLMMessage[] = [
        ...history,
        { role: 'user', content: query },
        {
          role: 'assistant',
          content: response.content,
          tool_calls: response.tool_calls,
        },
      ];

      for (const call of response.tool_calls) {
        if (call.type === 'function' && call.function.name === 'get_market_analysis') {
          const args = JSON.parse(call.function.arguments || '{}');
          safeLog('BorsaciAgent executing MCP tool', { args });

          const toolResultText = await this.executeMcpQuery(args.query);

          currentHistory.push({
            role: 'tool',
            content: toolResultText,
            tool_call_id: call.id,
          });
        }
      }

      // Final analysis by Kimi-k2.5
      safeLog(`${this.name} synthesizing tool results with kimi-k2.5`);
      response = await chat(null, currentHistory, `Role: Financial Analyst (KAYA)\n${systemPrompt}`, undefined, 'moonshotai/kimi-k2.5');
    }

    safeLog(`${this.name} analysis ready`);
    return response;
  }
}
