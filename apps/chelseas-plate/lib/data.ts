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

export type MenuItem = {
  id: string;
  restaurantId: string;
  name: string;
  category: string;
  description: string;
  components: MenuItemComponent[];
  allergens: Allergen[];
};
