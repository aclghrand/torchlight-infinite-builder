import { parseNumericValue, validateAllLevels } from "./progression_table";
import type { SupportLevelParser } from "./types";

export const preciseCrueltyParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  // levelBuffMods: DmgPct attack additional damage from Descript column (values[0])
  const buffDmgPctLevels: Record<number, number> = {};
  // levelBuffMods: AuraEffPct per cruelty_buff stack from Descript column
  const auraEffPctLevels: Record<number, number> = {};

  for (const [levelStr, values] of Object.entries(progressionTable.values)) {
    const level = Number(levelStr);
    const descript = values[0];

    if (descript !== undefined && descript !== "") {
      // Match "+12.5% additional Attack Damage" or "12.5% additional Attack Damage"
      const dmgMatch = descript.match(
        /[+]?([\d.]+)%\s+additional\s+Attack\s+Damage/i,
      );
      if (dmgMatch !== null) {
        buffDmgPctLevels[level] = parseNumericValue(dmgMatch[1], {
          asPercentage: true,
        });
      }

      // Match "2.5% additional Aura Effect per stack of the buff"
      const auraEffMatch = descript.match(
        /(\d+(?:\.\d+)?)%\s+additional\s+Aura\s+Effect\s+per\s+stack/i,
      );
      if (auraEffMatch !== null) {
        auraEffPctLevels[level] = parseNumericValue(auraEffMatch[1], {
          asPercentage: true,
        });
      }
    }
  }

  validateAllLevels(buffDmgPctLevels, skillName);
  validateAllLevels(auraEffPctLevels, skillName);

  // Return array matching template order:
  // levelBuffMods: [DmgPct attack, AuraEffPct]
  return [buffDmgPctLevels, auraEffPctLevels];
};
