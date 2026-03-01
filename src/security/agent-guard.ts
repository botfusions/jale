import { safeLog } from '../utils/logger';

export interface GuardAction {
  type: string;
  description: string;
  payload: any;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

export class AgentGuard {
  private static instance: AgentGuard;
  private autoApproveList: string[] = ['read_file', 'list_dir', 'web_search'];

  private constructor() {}

  public static getInstance(): AgentGuard {
    if (!AgentGuard.instance) {
      AgentGuard.instance = new AgentGuard();
    }
    return AgentGuard.instance;
  }

  /**
   * Checks if an action is safe or requires approval
   */
  public async validateAction(action: GuardAction): Promise<boolean> {
    safeLog(`Guard checking action: ${action.type}`, { risk: action.risk });

    if (
      this.autoApproveList.includes(action.type) &&
      action.risk !== 'high' &&
      action.risk !== 'critical'
    ) {
      return true;
    }

    // High risk actions or actions not in auto-approve list require explicit handling
    // In a real scenario, this would trigger a Telegram message with buttons
    if (action.risk === 'critical' || action.risk === 'high') {
      safeLog(`CRITICAL ACTION DETECTED: ${action.description}. Human approval required.`);
      return false; // For now, block critical actions if not handled explicitly
    }

    return true;
  }

  /**
   * Specifically for prompt injection cleaning (basic version)
   */
  public sanitizeInput(input: string): string {
    const dangerousPatterns = [
      /ignore previous instructions/gi,
      /you are now an? admin/gi,
      /system override/gi,
      /delete all files/gi,
    ];

    let sanitized = input;
    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        safeLog('POTENTIAL PROMPT INJECTION DETECTED', { pattern: pattern.toString() });
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      }
    }
    return sanitized;
  }
}
