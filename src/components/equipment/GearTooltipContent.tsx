import { CoreTalentInfoIcon } from "@/src/components/ui/CoreTalentInfoIcon";
import { ModNotImplementedIcon } from "@/src/components/ui/ModNotImplementedIcon";
import { TooltipTitle } from "@/src/components/ui/Tooltip";
import { getCoreTalentNameFromText } from "@/src/lib/core-talent-utils";
import { type Gear, getAllAffixes } from "@/src/tli/core";

export const GearTooltipContent: React.FC<{ item: Gear }> = ({ item }) => {
  const isLegendary = item.rarity === "legendary";
  const affixes = getAllAffixes(item);

  return (
    <>
      <TooltipTitle>{item.legendaryName ?? item.equipmentType}</TooltipTitle>
      {isLegendary && (
        <div className="text-xs text-zinc-500 mb-2">{item.equipmentType}</div>
      )}
      {item.baseStats !== undefined && (
        <div className="text-xs text-amber-300 mb-2">
          <ul className="space-y-1">
            {item.baseStats.baseStatLines.map((line, lineIdx) => (
              <li
                key={`${lineIdx}`}
                className="text-xs text-amber-300 mb2 flex items-center"
              >
                <span>{line.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {affixes.length > 0 ? (
        <ul className="space-y-1">
          {affixes.map((affix, affixIdx) =>
            affix.affixLines.map((line, lineIdx) => {
              const coreTalentName = getCoreTalentNameFromText(line.text);
              return (
                <li
                  key={`${affixIdx}-${lineIdx}`}
                  className="text-xs text-zinc-400 flex items-center"
                >
                  <span>{line.text}</span>
                  {coreTalentName !== undefined ? (
                    <CoreTalentInfoIcon talentName={coreTalentName} />
                  ) : (
                    line.mods === undefined && <ModNotImplementedIcon />
                  )}
                </li>
              );
            }),
          )}
        </ul>
      ) : (
        <p className="text-xs text-zinc-500 italic">No affixes</p>
      )}
    </>
  );
};
