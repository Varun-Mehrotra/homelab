import { type MenuItem, type Restaurant } from "@/lib/data";

export const allAllergens = [
  "barley",
  "egg",
  "fish",
  "milk",
  "mustard",
  "oat",
  "sesame seeds",
  "soy",
  "sulphites",
  "tree nuts",
  "wheat",
];

export const restaurants: Restaurant[] = [
  {
    id: "mcdonalds-canada",
    name: "McDonald's Canada",
    slug: "mcdonalds-canada",
    cuisineHint: "Burgers, breakfast, chicken, beverages, desserts, and more",
    description: "Current McDonald's Canada menu data sourced from live product pages and ingredient details.",
  },
];

export const menuItems: MenuItem[] = [
  {
    id: "big-mac-sandwich",
    restaurantId: "mcdonalds-canada",
    name: "Big Mac",
    category: "Beef",
    description:
      "Nothing compares to two 100% Canadian beef patties, special sauce, crisp lettuce, processed cheese, pickles and onions on a toasted sesame seed bun.",
    ingredients: [
      "beef patty",
      "big mac bun",
      "big mac sauce",
      "grill seasoning",
      "lettuce",
      "onions (dehydrated)",
      "pickle slices",
      "processed cheese",
    ],
    allergens: ["egg", "milk", "mustard", "sesame seeds", "soy", "wheat"],
  },
  {
    id: "egg-mcmuffin",
    restaurantId: "mcdonalds-canada",
    name: "Egg McMuffin",
    category: "Breakfast",
    description:
      "A freshly cracked Canada Grade A egg, Canadian bacon, melty processed cheddar cheese and butter on a toasted English muffin.",
    ingredients: ["butter", "canadian bacon", "egg", "english muffin", "processed cheese"],
    allergens: ["barley", "egg", "milk", "soy", "wheat"],
  },
  {
    id: "filet-o-fish",
    restaurantId: "mcdonalds-canada",
    name: "Filet-O-Fish",
    category: "Sandwiches & Wraps",
    description:
      "Tender fish topped with tartar sauce and half a slice of processed cheddar cheese on a soft steamed bun.",
    ingredients: ["filet-o-fish bun", "fish portion", "processed cheese", "tartar sauce"],
    allergens: ["egg", "fish", "milk", "soy", "wheat"],
  },
  {
    id: "small-french-fries",
    restaurantId: "mcdonalds-canada",
    name: "Small French Fries",
    category: "Snacks & Sides",
    description: "World famous fries made with Canadian potatoes and finished with just the right amount of salt.",
    ingredients: ["canola blend oil", "potatoes", "salt"],
    allergens: [],
  },
  {
    id: "cone-vanilla",
    restaurantId: "mcdonalds-canada",
    name: "Vanilla Cone",
    category: "Desserts & Shakes",
    description: "Creamy vanilla soft serve in a crisp cone for a simple sweet finish.",
    ingredients: ["large cone", "vanilla ice milk"],
    allergens: ["milk", "soy", "wheat"],
  },
];

export function getMenuItemsForRestaurantFixture(restaurantId: string) {
  return menuItems.filter((item) => item.restaurantId === restaurantId);
}
