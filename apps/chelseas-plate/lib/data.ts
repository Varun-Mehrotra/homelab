export type Allergen =
  | "eggs"
  | "fish"
  | "gluten"
  | "milk"
  | "mustard"
  | "peanuts"
  | "sesame"
  | "shellfish"
  | "soy"
  | "sulfites"
  | "tree nuts";

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
  allergens: Allergen[];
};

export const allergenOptions: Allergen[] = [
  "eggs",
  "fish",
  "gluten",
  "milk",
  "mustard",
  "peanuts",
  "sesame",
  "shellfish",
  "soy",
  "sulfites",
  "tree nuts",
];

export const restaurants: Restaurant[] = [
  {
    id: "tim-hortons",
    name: "Tim Hortons",
    slug: "tim-hortons",
    cuisineHint: "Coffee, breakfast, and baked goods",
    description: "A familiar stop for breakfast sandwiches, wraps, soups, and quick bakery snacks.",
  },
  {
    id: "a-and-w-canada",
    name: "A&W Canada",
    slug: "a-and-w-canada",
    cuisineHint: "Burgers and breakfast",
    description: "Classic burgers, breakfast sandwiches, and onion rings with plenty of dairy-forward options.",
  },
  {
    id: "harveys",
    name: "Harvey's",
    slug: "harveys",
    cuisineHint: "Custom burgers and poutines",
    description: "Build-your-own style burgers, veggie options, and comfort-food sides.",
  },
  {
    id: "mary-browns",
    name: "Mary Brown's",
    slug: "mary-browns",
    cuisineHint: "Fried chicken and taters",
    description: "Canadian fried chicken chain with sandwiches, wraps, and seasoned potato sides.",
  },
  {
    id: "new-york-fries",
    name: "New York Fries",
    slug: "new-york-fries",
    cuisineHint: "Fries, poutines, and hot dogs",
    description: "A fry-first menu with loaded poutines and street-food style hot dogs.",
  },
];

export const menuItems: MenuItem[] = [
  {
    id: "tim-farmers-wrap",
    restaurantId: "tim-hortons",
    name: "Farmer's Breakfast Wrap",
    category: "Breakfast",
    description: "Egg, hash brown, cheddar, chipotle sauce, and sausage in a flour tortilla.",
    allergens: ["eggs", "gluten", "milk", "soy"],
  },
  {
    id: "tim-chicken-noodle",
    restaurantId: "tim-hortons",
    name: "Chicken Noodle Soup",
    category: "Lunch",
    description: "A warm soup with noodles, chicken, and vegetables.",
    allergens: ["gluten", "soy"],
  },
  {
    id: "tim-garden-salad",
    restaurantId: "tim-hortons",
    name: "Garden Salad",
    category: "Lunch",
    description: "Mixed greens with tomatoes, cucumbers, and a light balsamic dressing.",
    allergens: ["sulfites"],
  },
  {
    id: "tim-honey-cruller",
    restaurantId: "tim-hortons",
    name: "Honey Cruller",
    category: "Bakery",
    description: "A sweet glazed doughnut with a soft airy center.",
    allergens: ["eggs", "gluten", "milk", "soy"],
  },
  {
    id: "aw-buddy-burger",
    restaurantId: "a-and-w-canada",
    name: "Buddy Burger",
    category: "Burgers",
    description: "A smaller beef burger with pickles, ketchup, mustard, and grilled onions.",
    allergens: ["gluten", "mustard", "soy"],
  },
  {
    id: "aw-beyond-burger",
    restaurantId: "a-and-w-canada",
    name: "Beyond Meat Burger",
    category: "Burgers",
    description: "Plant-based burger with lettuce, tomato, onion, pickles, ketchup, mustard, and mayo.",
    allergens: ["eggs", "gluten", "mustard", "soy"],
  },
  {
    id: "aw-onion-rings",
    restaurantId: "a-and-w-canada",
    name: "Onion Rings",
    category: "Sides",
    description: "Crisp battered onion rings served hot.",
    allergens: ["gluten", "milk"],
  },
  {
    id: "aw-sweet-potato-fries",
    restaurantId: "a-and-w-canada",
    name: "Sweet Potato Fries",
    category: "Sides",
    description: "Sweet potato fries with chipotle mayo for dipping.",
    allergens: ["eggs", "soy"],
  },
  {
    id: "harveys-grilled-chicken",
    restaurantId: "harveys",
    name: "Grilled Chicken Burger",
    category: "Burgers",
    description: "Flame-grilled chicken burger on a sesame seed bun.",
    allergens: ["gluten", "sesame", "soy"],
  },
  {
    id: "harveys-veggie-burger",
    restaurantId: "harveys",
    name: "Veggie Burger Lettuce Wrap",
    category: "Burgers",
    description: "Veggie patty wrapped in lettuce with tomatoes, pickles, and onions.",
    allergens: ["soy"],
  },
  {
    id: "harveys-poutine",
    restaurantId: "harveys",
    name: "Original Poutine",
    category: "Sides",
    description: "Fries topped with gravy and cheese curds.",
    allergens: ["milk", "soy"],
  },
  {
    id: "harveys-fries",
    restaurantId: "harveys",
    name: "French Fries",
    category: "Sides",
    description: "Classic fries cooked until crisp and salted.",
    allergens: [],
  },
  {
    id: "mary-big-mary",
    restaurantId: "mary-browns",
    name: "Big Mary Sandwich",
    category: "Sandwiches",
    description: "Signature breaded chicken breast sandwich on a bun.",
    allergens: ["gluten", "soy"],
  },
  {
    id: "mary-spicy-wrap",
    restaurantId: "mary-browns",
    name: "Spicy Chicken Wrap",
    category: "Wraps",
    description: "Breaded chicken with spicy mayo, lettuce, and tortilla wrap.",
    allergens: ["eggs", "gluten", "milk", "soy"],
  },
  {
    id: "mary-taters",
    restaurantId: "mary-browns",
    name: "Taters",
    category: "Sides",
    description: "Seasoned potato wedges and one of the safer-looking side choices on the menu.",
    allergens: [],
  },
  {
    id: "mary-mac-and-cheese",
    restaurantId: "mary-browns",
    name: "Mac & Cheese Salad",
    category: "Sides",
    description: "Creamy macaroni salad with cheddar and dressing.",
    allergens: ["eggs", "gluten", "milk", "mustard"],
  },
  {
    id: "nyf-classic-poutine",
    restaurantId: "new-york-fries",
    name: "Classic Poutine",
    category: "Poutine",
    description: "Fresh-cut fries with gravy and cheese curds.",
    allergens: ["milk", "soy"],
  },
  {
    id: "nyf-veggie-fries",
    restaurantId: "new-york-fries",
    name: "Fresh-Cut Fries",
    category: "Fries",
    description: "Plain fresh-cut fries with salt.",
    allergens: [],
  },
  {
    id: "nyf-butter-chicken",
    restaurantId: "new-york-fries",
    name: "Butter Chicken Poutine",
    category: "Poutine",
    description: "Fries with butter chicken sauce, gravy, and cheese curds.",
    allergens: ["milk", "soy"],
  },
  {
    id: "nyf-veggie-dog",
    restaurantId: "new-york-fries",
    name: "Veggie Dog",
    category: "Hot Dogs",
    description: "Plant-based hot dog on a bun with classic condiments.",
    allergens: ["gluten", "mustard", "soy"],
  },
];

export function getRestaurantBySlug(slug: string): Restaurant | undefined {
  return restaurants.find((restaurant) => restaurant.slug === slug);
}

export function getMenuItemsForRestaurant(restaurantId: string): MenuItem[] {
  return menuItems.filter((item) => item.restaurantId === restaurantId);
}
