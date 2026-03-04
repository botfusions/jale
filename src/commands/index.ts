/**
 * Command Router — Registers all bot commands from modular files
 *
 * Each command is a separate file in src/commands/.
 * This router imports and registers them all.
 */

import { Bot } from 'grammy';
import { registerCalendarCommands } from './calendar.commands';
import { registerMailCommands } from './mail.commands';
import { registerVoiceCommands } from './voice.commands';
import { registerToolCommands } from './tool.commands';
import { registerSkillCommands } from './skill.commands';
// No admin commands needed anymore
import { safeLog } from '../utils/logger';

export function registerAllCommands(bot: Bot): void {
  registerCalendarCommands(bot);
  registerMailCommands(bot);
  registerVoiceCommands(bot);
  registerToolCommands(bot);
  registerSkillCommands(bot);
  // registerAdminCommands(bot); // Removed

  safeLog('All commands registered');
}
