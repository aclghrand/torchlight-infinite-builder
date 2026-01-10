import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useEffect, useMemo, useRef, useState } from "react";

export interface SearchableSelectOption<T = string> {
  value: T;
  label: string;
  sublabel?: string;
}

export interface SearchableSelectOptionGroup<T = string> {
  label: string;
  options: SearchableSelectOption<T>[];
}

interface SearchableSelectProps<T extends string | number> {
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  options: SearchableSelectOption<T>[];
  groups?: SearchableSelectOptionGroup<T>[];
  placeholder?: string;
  size?: "sm" | "default" | "lg";
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  renderOption?: (
    option: SearchableSelectOption<T>,
    props: { active: boolean; selected: boolean },
  ) => React.ReactNode;
  renderSelectedTooltip?: (
    option: SearchableSelectOption<T>,
    triggerRect: DOMRect,
  ) => React.ReactNode;
}

const SIZE_CLASSES = {
  sm: "px-2 py-1 text-xs",
  default: "px-3 py-2 text-sm",
  lg: "px-4 py-2 text-sm",
} as const;

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

export const SearchableSelect = <T extends string | number>({
  value,
  onChange,
  options,
  groups,
  placeholder = "Select...",
  size = "default",
  disabled = false,
  className = "",
  autoFocus = false,
  renderOption,
  renderSelectedTooltip,
}: SearchableSelectProps<T>) => {
  const [query, setQuery] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [inputRect, setInputRect] = useState<DOMRect | undefined>(undefined);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current !== null) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleInputMouseEnter = (): void => {
    if (inputWrapperRef.current !== null) {
      setInputRect(inputWrapperRef.current.getBoundingClientRect());
    }
    setIsTooltipVisible(true);
  };

  const handleInputMouseLeave = (): void => {
    setIsTooltipVisible(false);
  };

  const allOptions = useMemo(() => {
    if (groups) {
      return groups.flatMap((g) => g.options);
    }
    return options;
  }, [options, groups]);

  const selectedOption = useMemo(
    () => allOptions.find((opt) => opt.value === value),
    [allOptions, value],
  );

  const filteredOptions = useMemo(() => {
    const lowerQuery = query.toLowerCase();
    const filterFn = (opt: SearchableSelectOption<T>) =>
      !query ||
      opt.label.toLowerCase().includes(lowerQuery) ||
      opt.sublabel?.toLowerCase().includes(lowerQuery);

    if (groups) {
      return groups
        .map((g) => ({ ...g, options: g.options.filter(filterFn) }))
        .filter((g) => g.options.length > 0);
    }
    return options.filter(filterFn);
  }, [options, groups, query]);

  const handleChange = (option: SearchableSelectOption<T> | null) => {
    onChange(option?.value);
    setQuery("");
    setIsInputFocused(false);
  };

  const isEmpty = value === undefined || value === "";

  return (
    <Combobox
      value={selectedOption ?? null}
      onChange={handleChange}
      disabled={disabled}
      immediate
    >
      <div className={`relative ${className}`}>
        <div
          ref={inputWrapperRef}
          onMouseEnter={handleInputMouseEnter}
          onMouseLeave={handleInputMouseLeave}
        >
          <ComboboxButton as="div" className="relative">
            <ComboboxInput
              ref={inputRef}
              className={`
                w-full bg-zinc-800 border border-zinc-700 rounded
                ${SIZE_CLASSES[size]}
                focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500
                ${isEmpty ? "text-zinc-500" : "text-zinc-50"}
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
              displayValue={(opt: SearchableSelectOption<T> | null) =>
                isInputFocused ? query : (opt?.label ?? "")
              }
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setIsInputFocused(true);
                setQuery("");
              }}
              onBlur={() => setIsInputFocused(false)}
              onKeyDown={(e) => {
                if (e.key === " ") e.stopPropagation();
              }}
              placeholder={placeholder}
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
            </span>
          </ComboboxButton>
        </div>

        <ComboboxOptions
          anchor="bottom start"
          className="
            w-[var(--input-width)] z-50 mt-1 max-h-60 overflow-auto rounded
            bg-zinc-800 border border-zinc-700 shadow-lg
            focus:outline-none
          "
        >
          {!query && (
            <ComboboxOption
              value={null}
              className={({ active }) => `
                ${SIZE_CLASSES[size]} cursor-pointer text-zinc-500
                ${active ? "bg-zinc-700" : ""}
              `}
            >
              {placeholder}
            </ComboboxOption>
          )}

          {filteredOptions.length === 0 && query !== "" ? (
            <div className={`${SIZE_CLASSES[size]} text-zinc-500`}>
              No results found
            </div>
          ) : groups ? (
            (filteredOptions as SearchableSelectOptionGroup<T>[]).map(
              (group) => (
                <div key={group.label}>
                  <div
                    className={`${SIZE_CLASSES[size]} text-zinc-500 font-medium border-t border-zinc-700 first:border-t-0`}
                  >
                    {group.label}
                  </div>
                  {group.options.map((option) => (
                    <ComboboxOption
                      key={String(option.value)}
                      value={option}
                      className={({ active, selected }) => `
                        ${SIZE_CLASSES[size]} cursor-pointer pl-4
                        ${active ? "bg-zinc-700" : ""}
                        ${selected ? "text-amber-400" : "text-zinc-50"}
                      `}
                    >
                      {({ active, selected }) => (
                        <div>
                          {renderOption ? (
                            renderOption(option, { active, selected })
                          ) : (
                            <>
                              <span>{option.label}</span>
                              {option.sublabel && (
                                <span className="text-zinc-500 ml-2 text-xs">
                                  {option.sublabel}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </ComboboxOption>
                  ))}
                </div>
              ),
            )
          ) : (
            (filteredOptions as SearchableSelectOption<T>[]).map((option) => (
              <ComboboxOption
                key={String(option.value)}
                value={option}
                className={({ active, selected }) => `
                  ${SIZE_CLASSES[size]} cursor-pointer
                  ${active ? "bg-zinc-700" : ""}
                  ${selected ? "text-amber-400" : "text-zinc-50"}
                `}
              >
                {({ active, selected }) => (
                  <div>
                    {renderOption ? (
                      renderOption(option, { active, selected })
                    ) : (
                      <>
                        <span>{option.label}</span>
                        {option.sublabel && (
                          <span className="text-zinc-500 ml-2 text-xs">
                            {option.sublabel}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>

        {renderSelectedTooltip !== undefined &&
          selectedOption !== undefined &&
          isTooltipVisible &&
          inputRect !== undefined &&
          renderSelectedTooltip(selectedOption, inputRect)}
      </div>
    </Combobox>
  );
};
