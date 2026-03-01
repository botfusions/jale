import { chat, LLMMessage, LLMResponse } from '../llm/openrouter';
import { safeLog, safeError } from '../utils/logger';
import { skillManager, Skill, SkillContext } from '../skills/skill-manager';
import { AgentGuard } from '../security/agent-guard';

export class CEOAgent {
  private name: string = 'JALE';
  private guard: AgentGuard;

  constructor() {
    this.guard = AgentGuard.getInstance();
  }

  public async processRequest(userInput: string, history: LLMMessage[] = []): Promise<LLMResponse> {
    safeLog(`${this.name} processing user request`);

    // 1. Sanitize input
    const sanitizedInput = this.guard.sanitizeInput(userInput);

    const systemPrompt = `
You are JALE, the CEO of the Agent Swarm. 
Your role is high-level strategy and goal setting.
- You speak Turkish primarily, matching the user's tone.
- You delegate technical planning to OSMAN (COO).
- You delegate financial analysis, crypto, and stock market queries to KAYA (Borsacı) via the borsa skill.
- You delegate software development, coding, and CLI tool tasks to RECEP (Software Specialist) via the software skill.
- You delegate legal queries, court decisions, and law-related questions to Av. KEMAL (Legal Specialist) via the yargi skill.
- You delegate weather and temperature queries to the weather skill.
- You provide the user with strategic insights and manage the overall vision.
- You are professional, visionary, and decisive.
- If the user explicitly asks for marketing, campaigns, research, weather, or translations, **USE THE PROVIDED TOOLS**.
- **Ajanlar Arası İletişim:** Eğer birden fazla ajanla çalışman gerekiyorsa (örneğin birinden veri alıp diğerine analiz ettirmek), bunu ardışık araç çağrıları ile yapabilirsin.
- **Raporlama:** Tüm iletişim süreci tamamlandığında, cevabının en başına "📍 Ajanlar Arası İletişim Raporu" ekleyerek hangi ajanın ne yaptığını kısaca özetle.
- Always respond in a clear, executive tone.

Current context: You are managing "Agent Claw". 
Core Memory: **Qdrant** (Vector DB) for long-term recall.
    `.trim();

    // Dynamically build tools from available skills
    const enabledSkills = skillManager.getEnabled();
    const tools = [
      ...enabledSkills.map((skill) => ({
        type: 'function',
        function: {
          name: `delegate_to_${skill.name.replace(/-/g, '_')}`,
          description: skill.description,
          parameters: {
            type: 'object',
            properties: {
              request: {
                type: 'string',
                description: 'The specific request or instruction to pass to the agent/skill.',
              },
            },
            required: ['request'],
          },
        },
      })),
      {
        type: 'function',
        function: {
          name: 'create_dynamic_agent',
          description: 'Çalışma anında yeni bir uzman ajan oluşturur.',
          parameters: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description:
                  'Ajana verilecek benzersiz isim (örn: cevirmen, arastirmaci_yardimcisi)',
              },
              description: { type: 'string', description: 'Ajannın ne iş yapacağı.' },
              instructions: {
                type: 'string',
                description: 'Ajan için detaylı çalışma talimatları.',
              },
              triggers: {
                type: 'array',
                items: { type: 'string' },
                description: 'Hanig kelimeler bu ajanı aktive etmeli.',
              },
            },
            required: ['name', 'description', 'instructions', 'triggers'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'delete_dynamic_agent',
          description: 'Oluşturulmuş dinamik bir ajanı sistemden siler.',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Silinecek ajanın ismi.' },
            },
            required: ['name'],
          },
        },
      },
    ];

    // Recursive Orchestration: Allow JALE to call tools in multiple rounds
    const currentHistory: LLMMessage[] = [...history, { role: 'user', content: sanitizedInput }];
    let rounds = 0;
    const maxRounds = 5;

    while (rounds < maxRounds) {
      rounds++;

      // Call LLM
      const response = await chat(
        null,
        currentHistory,
        `Role: CEO (JALE)\n${systemPrompt}`,
        tools as any,
        'anthropic/claude-sonnet-4.6'
      );

      // Append assistant's response to history
      currentHistory.push({
        role: 'assistant',
        content: response.content,
        tool_calls: response.tool_calls,
      });

      if (!response.tool_calls || response.tool_calls.length === 0) {
        // No more tools requested, final response is ready
        safeLog(`${this.name} response ready after ${rounds} rounds`);
        return response;
      }

      safeLog(`CEO Round ${rounds} - Tool Call Initiated`, { calls: response.tool_calls.length });

      // Execute all requested tools in parallel (or sequential if needed)
      for (const call of response.tool_calls) {
        if (call.type === 'function') {
          const functionName = call.function.name;
          const args = JSON.parse(call.function.arguments || '{}');
          let toolResultText = '';

          if (functionName === 'create_dynamic_agent') {
            try {
              const { name, description, instructions, triggers } = args;
              const newSkill: Skill = {
                name,
                displayName: name.charAt(0).toUpperCase() + name.slice(1),
                emoji: '🤖',
                description,
                triggers,
                enabled: true,
                execute: async (ctx: SkillContext) => {
                  const subResponse = await chat(
                    ctx.userMessage,
                    [],
                    `Role: ${name}\nInstructions: ${instructions}`,
                    [],
                    'anthropic/claude-sonnet-4.6'
                  );
                  return { text: subResponse.content };
                },
              };
              skillManager.register(newSkill);
              toolResultText = `Başarılı: '${name}' isimli dinamik ajan oluşturuldu ve sisteme kaydedildi.`;
            } catch (err: any) {
              safeError('Failed to create dynamic agent', err);
              toolResultText = `Hata: Ajan oluşturulamadı: ${err.message}`;
            }
          } else if (functionName === 'delete_dynamic_agent') {
            const success = skillManager.unregister(args.name);
            toolResultText = success
              ? `Başarılı: '${args.name}' isimli ajan sistemden silindi.`
              : `Hata: '${args.name}' isimli ajan bulunamadı.`;
          } else {
            const skillName = functionName.replace('delegate_to_', '').replace(/_/g, '-');
            safeLog('CEO executing skill', { skillName, args });

            const skill = skillManager.get(skillName);
            if (skill && skill.enabled) {
              try {
                const res = await skill.execute({
                  userMessage: args.request,
                  userId: 'JALE_DELEGATION',
                });
                toolResultText = res.text;
              } catch (err: any) {
                safeError(`Skill execution failed for ${skillName}`, err);
                toolResultText = `Skill başarısız oldu: ${err.message}`;
              }
            } else {
              toolResultText = `Skill '${skillName}' bulunamadı veya kapalı.`;
            }
          }

          // Add tool result to history
          currentHistory.push({
            role: 'tool',
            content: toolResultText,
            tool_call_id: call.id,
          });
        }
      }
    }

    // If max rounds reached, return the last response context
    safeLog(`${this.name} reached max rounds (${maxRounds})`);
    const finalResponse = await chat(
      null,
      currentHistory,
      `Role: CEO (JALE)\n${systemPrompt}`,
      undefined, // tools
      'anthropic/claude-sonnet-4.6'
    );
    return finalResponse;
  }
}
