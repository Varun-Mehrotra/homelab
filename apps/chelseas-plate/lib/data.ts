export type Allergen = string;

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cuisineHint: string;
};

export type MenuItem = {
  id: string;
  restaurantId: string;
  name: string;
  category: string;
  description: string;
  ingredients: string[];
  allergens: Allergen[];
};
