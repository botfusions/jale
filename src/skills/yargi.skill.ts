import { Skill, SkillContext, SkillResult } from './skill-manager';
import { safeLog, safeError } from '../utils/logger';
import { chat } from '../llm/openrouter';
import { spawn } from 'child_process';
import path from 'path';

// Helper fonksiyon: Güvenli komut çalıştırma
async function spawnCommand(command: string, args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      shell: false, // Güvenlik: shell'i kullanma
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      reject(new Error(`Command execution failed: ${error.message}`));
    });

    child.on('close', (code: number | null) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      } else {
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          resolve(stdout);
        }
      }
    });
  });
}

export const yargiSkill: Skill = {
  name: 'yargi',
  displayName: 'Avukat KEMAL (Yargı)',
  emoji: '⚖️',
  description:
    'Türk hukuk mevzuatları ve mahkeme kararları konusunda uzmandır. Yargı veritabanlarında arama yapabilir.',
  triggers: ['hukuk', 'yargı', 'mahkeme', 'karar', 'yargıtay', 'danıştay', 'esas no', 'mevzuat'],
  enabled: true,
  execute: async (ctx: SkillContext): Promise<SkillResult> => {
    try {
      safeLog('Yargi Skill running', { request: ctx.userMessage });

      // yargi-cli path (relative to root)
      const yargiCliPath = path.join(process.cwd(), 'yargi-cli', 'bin', 'yargi.js');
      const nodePath = 'node'; // Assume node is in path

      const systemPrompt = `
You are AVUKAT KEMAL, the Legal Specialist of the Agent Swarm.
Your expertise:
- Turkish Law, Court Decisions, and Regulations.
- Searching Bedesten (Adalet Bakanlığı) databases.
- Simplifying complex legal texts for the user.

KULLANIM KILAVUZU (yargi-cli):
- Desteklenen Mahkemeler (-c): YARGITAYKARARI, DANISTAYKARAR, YERELHUKUK, ISTINAFHUKUK, KYB
- Arama Operatörleri:
  + "ifade" (Tam cümle araması)
  + +terim (Zorunlu kelime)
  + -terim (Hariç tutulan kelime)
  + AND, OR, NOT (Mantıksal bağlaçlar)
- Komutlar: 
  + Arama: bedesten search "sorgu" [-c MAHKEME] [-p SAYFA]
  + Belge Getir: bedesten doc <documentId>

Your goal is to provide accurate legal information or search for relevant cases when asked.
If the user asks how to use this legal agent or what it can do, use the information above to answer.
Always summarize findings in Turkish. Professional and formal legal tone.
      `.trim();

      // First, use LLM to decide on the query or direct answer
      const response = await chat(
        ctx.userMessage,
        [],
        `Role: Legal Specialist (AVUKAT KEMAL)\n${systemPrompt}`,
        [
          {
            type: 'function',
            function: {
              name: 'yargi_search',
              description: 'Search for court decisions.',
              parameters: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: 'Search term' },
                  court: {
                    type: 'string',
                    enum: ['YARGITAYKARARI', 'DANISTAYKARAR', 'YERELHUKUK', 'ISTINAFHUKUK', 'KYB'],
                    description: 'Optional court type',
                  },
                  page: { type: 'number', description: 'Page number' },
                },
                required: ['query'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'yargi_get_doc',
              description: 'Get full text of a decision by document ID.',
              parameters: {
                type: 'object',
                properties: {
                  documentId: {
                    type: 'string',
                    description: 'The document ID obtained from search',
                  },
                },
                required: ['documentId'],
              },
            },
          },
        ],
        'anthropic/claude-sonnet-4.6'
      );

      if (response.tool_calls && response.tool_calls.length > 0) {
        const call = response.tool_calls[0];
        const args = JSON.parse(call.function.arguments);

        if (call.function.name === 'yargi_search') {
          // Güvenli: Argümanları dizi olarak geç
          const cmdArgs = [yargiCliPath, 'bedesten', 'search', args.query];
          if (args.court) cmdArgs.push('-c', args.court);
          if (args.page) cmdArgs.push('-p', args.page.toString());

          safeLog('Executing Yargi CLI', { args: cmdArgs });
          const resultData = await spawnCommand(nodePath, cmdArgs);

          // Summarize the CLI result with LLM
          const finalSummary = await chat(
            `CLI result: ${JSON.stringify(resultData)}\n\nUser Question: ${ctx.userMessage}`,
            [],
            `Role: Legal Specialist (AVUKAT KEMAL)\nYou are summarizing the search results from the legal database for the user.`,
            [],
            'anthropic/claude-sonnet-4.6'
          );

          return {
            text: `⚖️ **AVUKAT KEMAL (Hukuk Uzmanı) Yanıtı:**\n\n${finalSummary.content}`,
            voiceText: 'Hukuki sorgulama yaptım ve sonuçları özetledim.',
            data: resultData,
          };
        } else if (call.function.name === 'yargi_get_doc') {
          // Güvenli: Argümanları dizi olarak geç
          const cmdArgs = [yargiCliPath, 'bedesten', 'doc', args.documentId];

          safeLog('Executing Yargi CLI', { args: cmdArgs });
          const resultData = await spawnCommand(nodePath, cmdArgs);

          // Summarize the CLI result with LLM
          const finalSummary = await chat(
            `CLI result: ${JSON.stringify(resultData)}\n\nUser Question: ${ctx.userMessage}`,
            [],
            `Role: Legal Specialist (AVUKAT KEMAL)\nYou are summarizing the search results from the legal database for the user.`,
            [],
            'anthropic/claude-sonnet-4.6'
          );

          return {
            text: `⚖️ **AVUKAT KEMAL (Hukuk Uzmanı) Yanıtı:**\n\n${finalSummary.content}`,
            voiceText: 'Hukuki sorgulama yaptım ve sonuçları özetledim.',
            data: resultData,
          };
        }
      }

      return {
        text: `⚖️ **AVUKAT KEMAL (Hukuk Uzmanı) Yanıtı:**\n\n${response.content}`,
        voiceText: 'İsteğini inceledim, raporu hazırladım.',
      };
    } catch (error: any) {
      safeError('Yargi Skill Error', error);
      return {
        text: `⚠️ Hukuk uzmanı çalışırken bir hata oluştu: ${error.message}`,
        voiceText: 'Hukuki sorgulama şu an başarısız oldu.',
      };
    }
  },
};
