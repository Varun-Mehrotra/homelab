export type Allergen = string;

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cuisineHint: string;
};

export type MenuItemComponent = {
  id: string;
  name: string;
  ingredients: string;
  containsAllergens: Allergen[];
  mayContainAllergens: Allergen[];
};

export type MenuItemDetailMode = "components" | "ingredients" | "missing";

export type MenuItem = {
  id: string;
  restaurantId: string;
  name: string;
  category: string;
  description: string;
  detailMode: MenuItemDetailMode;
  components: MenuItemComponent[];
  ingredients?: string;
  containsAllergens: Allergen[];
  mayContainAllergens: Allergen[];
  allergens: Allergen[];
};
