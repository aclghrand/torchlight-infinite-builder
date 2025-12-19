import type { DivinityAffixType, SlateShape } from "@/src/tli/core";

export interface AffixSlotConstraint {
  allowedTypes: DivinityAffixType[];
  label: string;
}

export type CopyDirection = "up" | "down" | "left" | "right";

export interface FixedAffix {
  text: string;
  direction?: CopyDirection;
}

export interface LegendarySlateTemplate {
  key: string;
  displayName: string;
  shape: SlateShape;
  canRotate: boolean;
  canFlip: boolean;
  affixSlots: AffixSlotConstraint[];
  fixedAffixes?: FixedAffix[];
  description?: string;
}

export const LEGENDARY_SLATE_TEMPLATES: Record<string, LegendarySlateTemplate> =
  {
    "sparks-of-moth-fire": {
      key: "sparks-of-moth-fire",
      displayName: "Sparks of Moth Fire",
      shape: "Single",
      canRotate: false,
      canFlip: false,
      affixSlots: [],
      fixedAffixes: [
        {
          text: "Copies the last Talent on the adjacent slate above to this slate. Unable to copy the Core Talent.",
          direction: "up",
        },
        {
          text: "Copies the last Talent on the adjacent slate on the left to this slate. Unable to copy the Core Talent.",
          direction: "left",
        },
        {
          text: "Copies the last Talent on the adjacent slate below this slate. Unable to copy the Core Talents.",
          direction: "down",
        },
        {
          text: "Copies the last Talent on the adjacent slate on the right to this slate. Unable to copy the Core Talent.",
          direction: "right",
        },
      ],
      description: "1x1 slate that copies a talent from an adjacent direction",
    },
    "sparks-set-prairie": {
      key: "sparks-set-prairie",
      displayName: "When Sparks Set the Prairie Ablaze",
      shape: "Single",
      canRotate: false,
      canFlip: false,
      affixSlots: [],
      fixedAffixes: [
        {
          text: "Copies the last Talent on all adjacent slates. Unable to copy Core Talents.",
        },
      ],
      description: "1x1 slate that copies talents from all adjacent slates",
    },
    "corner-of-divinity": {
      key: "corner-of-divinity",
      displayName: "A Corner of Divinity",
      shape: "CornerL",
      canRotate: true,
      canFlip: true,
      affixSlots: [
        { allowedTypes: ["Legendary Medium"], label: "Legendary Medium" },
        { allowedTypes: ["Legendary Medium"], label: "Legendary Medium" },
      ],
      description: "3-cell L-shape with up to 2 Legendary Medium affixes",
    },
    "fallen-starlight": {
      key: "fallen-starlight",
      displayName: "Fallen Starlight",
      shape: "Vertical2",
      canRotate: true,
      canFlip: true,
      affixSlots: [
        { allowedTypes: ["Micro"], label: "Micro" },
        { allowedTypes: ["Micro"], label: "Micro" },
        {
          allowedTypes: ["Micro", "Medium", "Legendary Medium"],
          label: "Micro/Medium/Legendary",
        },
        {
          allowedTypes: ["Medium", "Legendary Medium"],
          label: "Medium/Legendary",
        },
      ],
      description: "2-cell vertical shape with 4 mixed affixes",
    },
    "pedigree-of-gods": {
      key: "pedigree-of-gods",
      displayName: "Pedigree of Gods",
      shape: "Pedigree",
      canRotate: true,
      canFlip: true,
      affixSlots: [
        {
          allowedTypes: ["Micro", "Medium", "Legendary Medium"],
          label: "Micro/Medium/Legendary",
        },
        {
          allowedTypes: ["Micro", "Medium", "Legendary Medium"],
          label: "Micro/Medium/Legendary",
        },
        {
          allowedTypes: ["Medium", "Legendary Medium", "Core"],
          label: "Medium/Legendary/Core",
        },
        { allowedTypes: ["Core"], label: "Core" },
      ],
      description: "7-cell shape with 4 affixes including core talents",
    },
  };

export const LEGENDARY_SLATE_KEYS = Object.keys(
  LEGENDARY_SLATE_TEMPLATES,
) as (keyof typeof LEGENDARY_SLATE_TEMPLATES)[];

export const getLegendarySlateTemplate = (
  key: string,
): LegendarySlateTemplate | undefined => {
  return LEGENDARY_SLATE_TEMPLATES[key];
};
