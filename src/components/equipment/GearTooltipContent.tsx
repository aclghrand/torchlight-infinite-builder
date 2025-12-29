import { CoreTalentInfoIcon } from "@/src/components/ui/CoreTalentInfoIcon";
import { ModNotImplementedIcon } from "@/src/components/ui/ModNotImplementedIcon";
import { TooltipTitle } from "@/src/components/ui/Tooltip";
import { getCoreTalentNameFromText } from "@/src/lib/core-talent-utils";
import { getAllAffixes } from "@/src/tli/calcs/affix-collectors";
import type { Gear } from "@/src/tli/core";

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
        <div>
          {affixes.map((affix, affixIdx) => (
            <div
              key={affixIdx}
              className={
                affixIdx > 0 ? "mt-1.5 pt-1.5 border-t border-zinc-700" : ""
              }
            >
              {affix.affixLines.map((line, lineIdx) => {
                const coreTalentName = getCoreTalentNameFromText(line.text);
                return (
                  <div
                    key={lineIdx}
                    className="text-xs text-zinc-400 flex items-center"
                  >
                    <span>{line.text}</span>
                    {coreTalentName !== undefined ? (
                      <CoreTalentInfoIcon talentName={coreTalentName} />
                    ) : (
                      line.mods === undefined && <ModNotImplementedIcon />
                    )}
                  </div>
                );
              })}
              {affix.maxDivinity !== undefined && (
                <div className="text-xs text-zinc-500">
                  (Max Divinity Effect: {affix.maxDivinity})
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-500 italic">No affixes</p>
      )}
    </>
  );
};
