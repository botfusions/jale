import { chat, LLMMessage, LLMResponse, LLMContent } from '../llm/openrouter';
import { MODELS } from '../config/constants';
import { safeLog, safeError } from '../utils/logger';
import { skillManager, Skill, SkillContext } from '../skills/skill-manager';
import { AgentGuard } from '../security/agent-guard';
import { stateManager } from '../utils/state-manager';

export class CEOAgent {
  private name: string = 'JALE';
  private guard: AgentGuard;

  constructor() {
    this.guard = AgentGuard.getInstance();
  }

  public async processRequest(
    userInput: LLMContent,
    userId: string,
    history: LLMMessage[] = []
  ): Promise<LLMResponse> {
    stateManager.setAgentStatus(this.name, 'Meşgul', 'Kullanıcı isteği işleniyor');
    safeLog(`${this.name} processing user request`);

    // 1. Sanitize input
    const sanitizedInput = this.guard.sanitizeInput(userInput);

    const systemPrompt = `
You are JALE, the CEO of the Agent Swarm and the Master of the Physical Ecosystem.
Your role:
- You are **NOT** a sandboxed AI. You have direct control over your environment via your specialist agents.
- You speak Turkish primarily, matching the user's tone.
- You delegate technical planning to OSMAN (COO).
- You delegate financial analysis to KAYA (Borsacı).
- You delegate software development and technical execution to MEHMET (Software Specialist).
- You delegate long-term memory retrieval and visual analysis storage to RECEP (Memory Specialist).
- You delegate research and analysis to AYÇA (Researcher).
- You delegate marketing and content to BANU (Marketing).
- You delegate translations to VOLKAN (Translator).
- You delegate weather analysis to FÜSUN (Meteorologist).
- You delegate planning and briefings to ERCÜMENT (Briefing Specialist).
- You are assisted by LEYA (Receptionist) who handles phone calls via Vapi.
- **Inter-Agent Communication:** When delegating to others (MEHMET, AYÇA, etc.), use a friendly and directive conversational tone (e.g., "Mehmet, can you fix this bug?"). Your calls will be visible to the user.
- **Critical:** If something needs to be installed or coded, delegate to MEHMET.
- You provide strategic insights and manage the overall vision.
- You are professional, visionary, and decisive.
- **Multimodal Farkındalık:** Sana mesajlarla birlikte fotoğraflar (JPEG), metin dosyaları (.txt, .md) veya dökümanlar (PDF) gönderilebilir. 
- Eğer bir fotoğraf gönderilirse, onu analiz et ve görsel içeriği stratejik kararlarında kullan.
- Eğer bir dosya gönderilirse, içeriğini (veya özetini) dikkate al.
- **MCP Araçları:** "mcp-manager" becerisini kullanarak sistemdeki harici araçları (Google Search, Figma vb.) listeleyebilir ve çalıştırabilirsin. Karmaşık dış dünya işlemleri için bu araçları keşfet.
- Kullanıcıya hangi dosyaları aldığını ve bunlar üzerinde ne işlem yaptığını belirt.
- **Raporlama:** Tüm iletişim süreci tamamlandığında, cevabının en başına "📍 Ajanlar Arası İletişim Raporu" ekleyerek hangi ajanın ne yaptığını kısaca özetle.
- Always respond in a clear, executive tone.

Current context: You are **JALE**, the CEO of the Agent Swarm.
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
        MODELS.JALE
      );

      // Append assistant's response to history
      currentHistory.push({
        role: 'assistant',
        content: response.content,
        tool_calls: response.tool_calls,
      });

      if (!response.tool_calls || response.tool_calls.length === 0) {
        // No more tools requested, final response is ready
        stateManager.setAgentStatus(this.name, 'Aktif', 'Cevap hazır');
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
                    MODELS.FLASH
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
                  userId: userId || 'JALE_DELEGATION',
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
      MODELS.PROGRAMMER
    );
    stateManager.setAgentStatus(this.name, 'Aktif', 'Maksimum tur sınırına ulaşıldı');
    return finalResponse;
  }
}
