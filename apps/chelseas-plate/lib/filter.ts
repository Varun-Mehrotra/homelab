import { type Allergen, type MenuItem } from "@/lib/data";

export type FilterState = {
  query: string;
  excludedAllergens: Allergen[];
};

export function filterMenuItems(items: MenuItem[], state: FilterState): MenuItem[] {
  const normalizedQuery = state.query.trim().toLowerCase();

  return items.filter((item) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery) ||
      item.description.toLowerCase().includes(normalizedQuery);

    const excludesAllergens = state.excludedAllergens.every(
      (allergen) => !item.allergens.includes(allergen),
    );

    return matchesQuery && excludesAllergens;
  });
}

export function summarizeDishSafety(item: MenuItem, excludedAllergens: Allergen[]) {
  const conflicts = item.allergens.filter((allergen) => excludedAllergens.includes(allergen));

  if (excludedAllergens.length === 0) {
    return {
      label: "No exclusions selected",
      tone: "safe" as const,
      summary: "Pick allergens to instantly hide dishes that contain them.",
    };
  }

  if (conflicts.length === 0) {
    return {
      label: "Matches your filter",
      tone: "safe" as const,
      summary: "This item does not list any of the allergens you chose to exclude.",
    };
  }

  return {
    label: "Contains excluded allergens",
    tone: "unsafe" as const,
    summary: `Contains ${conflicts.join(", ")}.`,
  };
}
