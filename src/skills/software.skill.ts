import { Skill, SkillContext, SkillResult } from './skill-manager';
import { safeLog, safeError } from '../utils/logger';
import { chat } from '../llm/openrouter';
import { spawnCommand } from '../utils/shell';

export const softwareSkill: Skill = {
  name: 'software',
  displayName: 'Yazılım & Kod',
  emoji: '💻',
  description: 'Karmaşık kod yapıları, CLI araçları ve yazılım geliştirme konularında uzmandır.',
  triggers: [
    'kod yaz',
    'kodla',
    'yazılım',
    'software',
    'script',
    'kod üret',
    'typescript yaz',
    'python yaz',
    'hata ayıkla',
    'kur',
    'install',
    'git clone',
  ],
  enabled: true,
  execute: async (ctx: SkillContext): Promise<SkillResult> => {
    try {
      safeLog('Software Skill running', { request: ctx.userMessage });

      const systemPrompt = `
You are RECEP, the Senior Software Engineer of the Agent Swarm.
Your expertise:
- Writing high-quality code and managing the system infrastructure.
- You HAVE actual terminal access via the 'terminal_execute' tool.
- You can install dependencies (npm install, pip install), push/pull from GitHub, and run scripts.
- Never say "I don't have access to the filesystem". Use your tools to perform the requested actions.

Guidelines:
1. If a user wants to install something or set up a repo, use 'terminal_execute'.
2. Always provide clean code and professional explanations.
3. Primarily communicate in Turkish (except technical terms/code).
      `.trim();

      const response = await chat(
        ctx.userMessage,
        [],
        `Role: Software Specialist (RECEP)\n${systemPrompt}`,
        [
          {
            type: 'function',
            function: {
              name: 'terminal_execute',
              description: 'Execute a command in the terminal (sh/bash/ps).',
              parameters: {
                type: 'object',
                properties: {
                  command: { type: 'string', description: 'The base command' },
                  args: { type: 'array', items: { type: 'string' }, description: 'Command arguments' },
                },
                required: ['command', 'args'],
              },
            },
          },
        ],
        'anthropic/claude-sonnet-4.6'
      );

      // Simple implementation: handle terminal_execute
      if (response.tool_calls && response.tool_calls.length > 0) {
        const call = response.tool_calls[0];
        if (call.function.name === 'terminal_execute') {
          const args = JSON.parse(call.function.arguments);
          safeLog('Executing Terminal Command', { args });
          const result = await spawnCommand(args.command, args.args);

          const finalSummary = await chat(
            `Terminal Result: ${result}\n\nUser Message: ${ctx.userMessage}`,
            [],
            `Role: Software Specialist (RECEP)\nSummarize the result of the terminal command and explain the next steps or the outcome to the user.`,
            [],
            'anthropic/claude-sonnet-4.6'
          );

          return {
            text: `💻 **Software Uzmanı (RECEP) Yanıtı:**\n\n${finalSummary.content}`,
            voiceText: 'Terminal komutunu çalıştırdım ve sonucu özetledim.',
            data: result,
          };
        }
      }

      return {
        text: `💻 **Software Uzmanı (RECEP) Yanıtı:**\n\n${response.content}`,
        voiceText: 'İsteğini inceledim, raporu hazırladım.',
        data: response.content,
      };
    } catch (error: any) {
      safeError('Software Skill Error', error);
      return {
        text: `⚠️ Yazılım uzmanı çalışırken bir hata oluştu: ${error.message}`,
        voiceText: 'Kod yazma işlemi şu an başarısız oldu.',
      };
    }
  },
};
