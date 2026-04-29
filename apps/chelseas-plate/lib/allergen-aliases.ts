import { type Allergen } from "@/lib/data";

const EXTRA_ALLERGENS = ["garlic", "msg", "onion"] as const satisfies readonly Allergen[];

const ALLERGEN_ALIAS_PATTERNS: Record<Allergen, RegExp[]> = {
  garlic: [/\bgarlic\b/i, /\bgarlic powder\b/i],
  msg: [/\bmsg\b/i, /\bmonosodium glutamate\b/i],
  onion: [/\bonion\b/i, /\bonions\b/i, /\bonion powder\b/i],
};

export function getExtraAllergens() {
  return [...EXTRA_ALLERGENS];
}

export function deriveAliasAllergensFromText(text: string) {
  return Object.entries(ALLERGEN_ALIAS_PATTERNS)
    .flatMap(([allergen, patterns]) => (patterns.some((pattern) => pattern.test(text)) ? [allergen] : []))
    .sort((left, right) => left.localeCompare(right));
}

export function mergeAllergens(...allergenLists: Allergen[][]) {
  return Array.from(new Set(allergenLists.flat())).sort((left, right) => left.localeCompare(right));
}
