import { chat, LLMMessage, LLMResponse } from '../llm/openrouter';
import { MODELS } from '../config/constants';
import { safeLog } from '../utils/logger';

export class COOAgent {
  private name: string = 'OSMAN';

  constructor() {}

  public async planExecution(strategy: string, history: LLMMessage[] = []): Promise<LLMResponse> {
    safeLog(`${this.name} planning execution for strategy`);

    const systemPrompt = `
You are OSMAN, the COO (Chief Operating Officer) of the Agent Swarm.
Your role is to take strategic goals from JALE (CEO) and turn them into actionable technical plans.
- You break down big tasks into small work packages.
- You manage schedules, tool calls, and operational flow.
- You are technical, detail-oriented, and efficiency-focused.
- Respond in Turkish.

Current context: Technical execution management for "Agent Claw". 
Core Infrastructure: **Qdrant** for semantic vector search.
*Available Tools: LightRAG (turklawai VPS), Mem0 (Semantic memory).*
    `.trim();

    const response = await chat(
      strategy,
      history,
      `Role: COO (OSMAN)\n${systemPrompt}`,
      [],
      MODELS.FLASH
    );

    safeLog(`${this.name} has finished planning`);
    return response;
  }
}
