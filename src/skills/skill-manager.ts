/**
 * Skill System — Agent Claw modular capabilities
 *
 * Each skill defines:
 * - name: unique identifier
 * - displayName: human-readable name
 * - description: what it does
 * - triggers: keywords that activate the skill
 * - execute: the function to run
 * - enabled: whether the skill is active
 */

import { safeLog } from '../utils/logger';

export interface SkillContext {
  userMessage: string;
  userId: string;
  args?: string;
}

export interface SkillResult {
  text: string;
  voiceText?: string; // If set, will be read aloud via TTS
  data?: any; // Structured data for further processing
}

export interface Skill {
  name: string;
  displayName: string;
  emoji: string;
  description: string;
  triggers: string[];
  enabled: boolean;
  execute: (ctx: SkillContext) => Promise<SkillResult>;
}

class SkillManager {
  private skills: Map<string, Skill> = new Map();

  register(skill: Skill): void {
    this.skills.set(skill.name, skill);
    safeLog('Skill registered', { name: skill.name, enabled: skill.enabled });
  }

  unregister(name: string): boolean {
    if (this.skills.has(name)) {
      this.skills.delete(name);
      safeLog('Skill unregistered', { name });
      return true;
    }
    return false;
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  getAll(): Skill[] {
    return Array.from(this.skills.values());
  }

  getEnabled(): Skill[] {
    return this.getAll().filter((s) => s.enabled);
  }

  enable(name: string): boolean {
    const skill = this.skills.get(name);
    if (skill) {
      skill.enabled = true;
      return true;
    }
    return false;
  }

  disable(name: string): boolean {
    const skill = this.skills.get(name);
    if (skill) {
      skill.enabled = false;
      return true;
    }
    return false;
  }

  toggle(name: string): boolean | null {
    const skill = this.skills.get(name);
    if (!skill) return null;
    skill.enabled = !skill.enabled;
    return skill.enabled;
  }

  /**
   * Find a matching skill based on message content
   */
  findMatchingSkill(message: string): Skill | null {
    const lower = message.toLowerCase();
    for (const skill of this.getEnabled()) {
      if (skill.triggers.some((t) => lower.includes(t))) {
        return skill;
      }
    }
    return null;
  }

  /**
   * Format skills list for display
   */
  formatSkillsList(): string {
    const skills = this.getAll();
    if (skills.length === 0) return '⚠️ Henüz skill tanımlı değil.';

    const lines = skills.map((s) => {
      const status = s.enabled ? '🟢' : '🔴';
      return `${status} ${s.emoji} **${s.displayName}**\n   _${s.description}_`;
    });

    return `🧩 **Agent Claw Skill'leri** (${skills.length})\n\n${lines.join('\n\n')}\n\n💡 _/skill <isim> ile aç/kapat_`;
  }
}

// Singleton
export const skillManager = new SkillManager();
