import { Skill } from "@/src/tli/offense";

interface SkillEntryProps {
  skill: Skill;
  enabled: boolean;
  onToggle: () => void;
  onRemove: () => void;
}

export const SkillEntry: React.FC<SkillEntryProps> = ({
  skill,
  enabled,
  onToggle,
  onRemove,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow flex items-center justify-between">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={onToggle}
          className="w-5 h-5"
        />
        <span
          className={
            enabled
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-zinc-500 dark:text-zinc-500"
          }
        >
          {skill}
        </span>
      </div>
      <button
        onClick={onRemove}
        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm text-white"
      >
        Remove
      </button>
    </div>
  );
};
