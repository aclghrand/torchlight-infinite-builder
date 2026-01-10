export interface Prism {
  type: string;
  rarity: string;
  affix: string;
  replacementCoreTalent?: { name: string; affix: string };
  addedCoreTalentAffix?: string;
}
