import { Skill, SkillContext, SkillResult } from './skill-manager';
import { safeLog, safeError } from '../utils/logger';
import { chat } from '../llm/openrouter';

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
  ],
  enabled: true,
  execute: async (ctx: SkillContext): Promise<SkillResult> => {
    try {
      safeLog('Software Skill running', { request: ctx.userMessage });

      const systemPrompt = `
You are RECEP, the Senior Software Engineer of the Agent Swarm.
Your expertise:
- Writing high-quality, efficient, and well-documented code.
- Specializing in TypeScript, Node.js, Python, and CLI tools.
- Following best practices (SOLID, DRY, Clean Code).
- Providing clear explanations for your code.
- Debugging complex issues and suggesting optimizations.

Guidelines:
1. Always provide clean, ready-to-use code.
2. Include comments for complex logic.
3. If writing a CLI tool, show how to run it.
4. Professional and technical tone.
5. Primarily communicate in Turkish, but keep code and technical terms in English as per rules.
      `.trim();

      const response = await chat(
        ctx.userMessage,
        [],
        `Role: Software Specialist (RECEP)\n${systemPrompt}`,
        [],
        'anthropic/claude-sonnet-4.6'
      );

      return {
        text: `💻 **Software Uzmanı (RECEP) Yanıtı:**\n\n${response.content}`,
        voiceText: 'İstediğin kodu hazırladım, detayları raporda görebilirsin.',
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
