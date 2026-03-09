import { MODELS } from '../config/constants';

export type AgentStatus = 'Aktif' | 'Beklemede' | 'Meşgul' | 'Hata';

interface AgentState {
  name: string;
  role: string;
  model: string;
  status: AgentStatus;
  lastAction?: string;
  lastSeen: string;
}

interface SkillState {
  name: string;
  displayName: string;
  emoji: string;
  status: 'Aktif' | 'Pasif';
}

class StateManager {
  private static instance: StateManager;
  private agentStates: Record<string, AgentState> = {};
  private skillStates: Record<string, SkillState> = {};

  private constructor() {
    this.initializeDefaultAgents();
  }

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  private initializeDefaultAgents() {
    this.updateAgent('JALE', 'Orkestratör', MODELS.JALE, 'Aktif');
    this.updateAgent('MEHMET', 'Yazılım Geliştirici', MODELS.PROGRAMMER, 'Beklemede');
    this.updateAgent('AYÇA', 'Araştırmacı', MODELS.FLASH, 'Beklemede');
    this.updateAgent('KEMAL', 'Hukuk Danışmanı', MODELS.FLASH, 'Beklemede');
  }

  public updateAgent(
    name: string,
    role: string,
    model: string,
    status: AgentStatus,
    action?: string
  ) {
    this.agentStates[name.toUpperCase()] = {
      name: name.toUpperCase(),
      role,
      model,
      status,
      lastAction: action,
      lastSeen: new Date().toISOString(),
    };
  }

  public setAgentStatus(name: string, status: AgentStatus, action?: string) {
    const key = name.toUpperCase();
    if (this.agentStates[key]) {
      this.agentStates[key].status = status;
      if (action) this.agentStates[key].lastAction = action;
      this.agentStates[key].lastSeen = new Date().toISOString();
    }
  }

  public updateSkill(name: string, displayName: string, emoji: string, enabled: boolean) {
    this.skillStates[name] = {
      name,
      displayName,
      emoji,
      status: enabled ? 'Aktif' : 'Pasif',
    };
  }

  public getSystemStatus() {
    return {
      agents: Object.values(this.agentStates),
      skills: Object.values(this.skillStates),
      timestamp: new Date().toISOString(),
    };
  }
}

export const stateManager = StateManager.getInstance();
