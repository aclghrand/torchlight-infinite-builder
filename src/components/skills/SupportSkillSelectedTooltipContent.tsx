import { TooltipContent, TooltipTitle } from "@/src/components/ui/Tooltip";
import type { BaseSkill } from "@/src/data/skill/types";
import type { BaseSupportSkillSlot, SupportAffix } from "@/src/tli/core";

interface SupportSkillSelectedTooltipContentProps {
  skill: BaseSkill;
  slot: BaseSupportSkillSlot;
}

/**
 * Filter description lines to only show support target info.
 * Keeps lines starting with "Supports", "Cannot support", or "This skill can only be installed".
 */
const filterDescriptionLines = (description: string): string[] => {
  return description
    .split("\n")
    .filter(
      (line) =>
        line.startsWith("Supports") ||
        line.startsWith("Cannot support") ||
        line.startsWith("This skill can only be installed"),
    );
};

/**
 * Check if an affix is the rank damage bonus affix.
 */
const isRankDamageAffix = (text: string): boolean =>
  /^\+\d+% additional damage for the supported skill$/.test(text);

/**
 * Reorder Magnificent/Noble support affixes from storage order to display order.
 * Storage order: [tier-scaled?, ...fixed, rank?]
 * Display order: [rank?, ...fixed, tier-scaled?]
 */
const reorderSpecialSupportAffixes = (
  affixes: SupportAffix[],
): SupportAffix[] => {
  if (affixes.length === 0) return affixes;

  const rankAffix = affixes.find((a) => isRankDamageAffix(a.text));

  // First affix is tier-scaled if it's not rank damage
  const tierScaledAffix =
    affixes.length > 0 && !isRankDamageAffix(affixes[0].text)
      ? affixes[0]
      : undefined;

  const fixedAffixes = affixes.filter(
    (a) => a !== rankAffix && a !== tierScaledAffix,
  );

  return [
    ...(rankAffix !== undefined ? [rankAffix] : []),
    ...fixedAffixes,
    ...(tierScaledAffix !== undefined ? [tierScaledAffix] : []),
  ];
};

export const SupportSkillSelectedTooltipContent: React.FC<
  SupportSkillSelectedTooltipContentProps
> = ({ skill, slot }) => {
  // Filter description to only show support target info
  const filteredLines =
    skill.description.length > 0
      ? filterDescriptionLines(skill.description[0])
      : [];

  // Reorder affixes for Magnificent/Noble supports
  const displayAffixes =
    slot.skillType === "magnificent_support" ||
    slot.skillType === "noble_support"
      ? reorderSpecialSupportAffixes(slot.affixes)
      : slot.affixes;

  return (
    <>
      <TooltipTitle>{skill.name}</TooltipTitle>

      {skill.tags.length > 0 && (
        <div className="text-xs text-zinc-500 mb-2">
          {skill.tags.join(" • ")}
        </div>
      )}

      {/* Support target info */}
      {filteredLines.length > 0 && (
        <TooltipContent>{filteredLines.join("\n")}</TooltipContent>
      )}

      {/* Divider */}
      <hr className="border-zinc-700 my-2" />

      {/* Affixes with mod implementation status */}
      {displayAffixes.length > 0 ? (
        <div>
          {displayAffixes.map((affix, i) => {
            const isImplemented = affix.mods !== undefined;
            return (
              <div
                key={i}
                className={i > 0 ? "mt-1 pt-1 border-t border-zinc-800" : ""}
              >
                <div className="text-xs text-zinc-400">{affix.text}</div>
                {!isImplemented && (
                  <div className="text-xs text-red-500">
                    (Mod not supported in TOB yet)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-zinc-500 italic">No affixes</div>
      )}
    </>
  );
};
