import { Skill, SkillContext, SkillResult } from './skill-manager';
import { listMcpServers, listMcpTools, callMcpTool, listAllMcpTools } from '../utils/mcp';
import { safeLog, safeError } from '../utils/logger';

export const mcpManagerSkill: Skill = {
  name: 'mcp-manager',
  displayName: 'MCP Yöneticisi',
  emoji: '🧳',
  description: 'MCP sunucularındaki araçları listeler ve çalıştırır.',
  triggers: ['mcp', 'araçlar', 'tool', 'services', 'connect'],
  enabled: true,
  execute: async (ctx: SkillContext): Promise<SkillResult> => {
    try {
      const input = ctx.userMessage.toLowerCase().trim();

      // Case 1: List all tools
      if (
        input.includes('liste') ||
        input.includes('list') ||
        input === 'mcp' ||
        input === 'araçlar'
      ) {
        const allTools = await listAllMcpTools();

        if (allTools.length === 0) {
          return {
            text: '🧳 Şu an bağlı herhangi bir MCP aracı bulunamadı.',
            voiceText: 'Bağlı bir araç bulamadım.',
          };
        }

        let response = '🧳 **Erişilebilir MCP Araçları**\n\n';
        const grouped = allTools.reduce((acc: any, tool) => {
          if (!acc[tool.server]) acc[tool.server] = [];
          acc[tool.server].push(tool);
          return acc;
        }, {});

        for (const server in grouped) {
          response += `🔹 **${server}**\n`;
          for (const tool of grouped[server]) {
            response += `   - \`${tool.name}\`: ${tool.description || 'Açıklama yok'}\n`;
          }
          response += '\n';
        }

        return {
          text: response,
          voiceText: `${allTools.length} adet araç kullanıma hazır.`,
        };
      }

      // Case 2: Call a tool (This part might be handled better if the LLM is instructed)
      // For now, providing a status message for manual/agent debugging
      return {
        text: '🧳 MCP katmanı aktif. Araçları listelemek için "mcp list" diyebilirsiniz.\n\nAjanlar bu katmanı arka planda araç çalıştırmak için kullanabilir.',
        voiceText: 'MCP katmanı çalışıyor.',
      };
    } catch (error: any) {
      safeError('MCP Manager Skill Error', error);
      return {
        text: `⚠️ MCP İşlemi başarısız: ${error.message}`,
        voiceText: 'MCP işlemi sırasında bir hata oluştu.',
      };
    }
  },
};
