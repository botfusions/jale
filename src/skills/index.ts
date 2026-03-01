/**
 * Skills Index
 *
 * Register new skills here.
 * Each skill is a separate file in this directory.
 *
 * Usage: import and call registerAllSkills() at startup.
 */

import { skillManager } from './skill-manager';
import { webSearchSkill } from './web-search.skill';
import { weatherSkill } from './weather.skill';
import { translatorSkill } from './translator.skill';
import { briefingSkill } from './briefing.skill';
import { researcherSkill } from './researcher.skill';
import { marketingSkill } from './marketing.skill';
import { borsaSkill } from './borsa.skill';
import { softwareSkill } from './software.skill';
import { yargiSkill } from './yargi.skill';

export function registerAllSkills(): void {
  skillManager.register(webSearchSkill);
  skillManager.register(weatherSkill);
  skillManager.register(translatorSkill);
  skillManager.register(briefingSkill);
  skillManager.register(researcherSkill);
  skillManager.register(marketingSkill);
  skillManager.register(borsaSkill);
  skillManager.register(softwareSkill);
  skillManager.register(yargiSkill);
}

export { skillManager } from './skill-manager';
