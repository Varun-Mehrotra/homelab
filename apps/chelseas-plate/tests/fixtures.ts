import { type MenuItem, type Restaurant } from "@/lib/data";

export const allAllergens = [
  "egg",
  "garlic",
  "msg",
  "mustard",
  "onion",
  "sesame seeds",
  "soy",
  "wheat",
];

export const restaurants: Restaurant[] = [
  {
    id: "mcdonalds-canada",
    name: "McDonald's Canada",
    slug: "mcdonalds-canada",
    cuisineHint: "Burgers and chicken sandwiches",
    description: "A small curated McDonald's Canada menu used while items are being added incrementally.",
  },
];

export const menuItems: MenuItem[] = [
  {
    id: "hamburger",
    restaurantId: "mcdonalds-canada",
    name: "Hamburger",
    category: "Beef",
    description:
      "The comforting taste of the juicy and delicious 100% Canadian beef burger, topped with tangy pickles, ketchup, mustard and the sweet bite of onion, all on a freshly toasted bun. Just like you remember.",
    components: [
      {
        id: "hamburger-regular-bun",
        name: "Regular Bun",
        ingredients:
          "Enriched wheat flour, Water, Sugars (sugar, corn dextrose, corn maltodextrin), Yeast, Vegetable oil (canola and/or soy), Vegetable proteins (pea, potato, faba bean), Sunflower oil, Corn starch, Salt, May contain and or all of the following in varying proportions: Wheat gluten, Dough conditioners (monoglycerides, datem, ascorbic acid, enzymes), Vinegar.",
        containsAllergens: ["wheat"],
        mayContainAllergens: ["sesame seeds"],
      },
      {
        id: "hamburger-beef-patty",
        name: "Beef Patty",
        ingredients: "100% pure beef.",
        containsAllergens: [],
        mayContainAllergens: [],
      },
      {
        id: "hamburger-ketchup",
        name: "Ketchup",
        ingredients: "Tomato paste, Sugars (sugar/glucose-fructose), Water, Vinegar, Salt, Natural flavour.",
        containsAllergens: [],
        mayContainAllergens: [],
      },
      {
        id: "hamburger-pickle-slices",
        name: "Pickle Slices",
        ingredients:
          "Cucumbers, Water, Distilled vinegar, Salt, Calcium chloride, Potassium sorbate (preservative), Aluminum sulphate, Natural flavour (plant source), Polysorbate 80, Extractives of tumeric (colour).",
        containsAllergens: [],
        mayContainAllergens: [],
      },
      {
        id: "hamburger-onions-dehydrated",
        name: "Onions (dehydrated)",
        ingredients: "100% onions.",
        containsAllergens: [],
        mayContainAllergens: [],
      },
      {
        id: "hamburger-mustard",
        name: "Mustard",
        ingredients: "Water, Vinegar, Mustard seed, Salt, Turmeric, Natural flavour (plant source), Spice.",
        containsAllergens: ["mustard"],
        mayContainAllergens: [],
      },
      {
        id: "hamburger-grill-seasoning",
        name: "Grill Seasoning",
        ingredients: "Salt, Spice (pepper), Sunflower oil (used as a processing aid).",
        containsAllergens: [],
        mayContainAllergens: [],
      },
    ],
    allergens: ["mustard", "onion", "sesame seeds", "wheat"],
  },
  {
    id: "mcchicken",
    restaurantId: "mcdonalds-canada",
    name: "McChicken",
    category: "Chicken",
    description:
      "Breaded seasoned chicken and crisp lettuce, topped with our Mayo-Style Sauce. Some ingredients are just meant to be together.",
    components: [
      {
        id: "mcchicken-portion",
        name: "McChicken Portion",
        ingredients:
          "Chicken, Wheat flour, Water, Chicken skin, Toasted wheat crumbs with spice extractives, Corn starch, Modified corn starch, Salt, Yellow corn flour, Canola oil, Spices, Baking soda, Sodium aluminum phosphate, Potassium chloride, Flavour (hydrolyzed corn, soy and wheat gluten protein, flavour, disodium inosinate, disodium guanylate), Wheat starch. Cooked in vegetable oil (high oleic low linoleic canola oil and/or canola oil, corn oil, soybean oil, hydrogenated soybean oil, citric acid, dimethylpolysiloxane).",
        containsAllergens: ["soy", "wheat"],
        mayContainAllergens: [],
      },
      {
        id: "mcchicken-sesame-seed-bun",
        name: "Sesame Seed Bun",
        ingredients:
          "Enriched wheat flour, Water, Sugars (sugar, corn dextrose, corn maltodextrin), Yeast, Vegetable oil (canola and/or soy), Sesame seeds, Vegetable proteins (pea, potato, fava bean), Sunflower oil, Corn starch, Salt, May contain any or all of the following in varying proportions: Wheat gluten, Guar gum, Dough conditioner (monoglycerides, DATEM, ascorbic acid, enzymes), Tricalcium phosphate, Natural flavour, Corn starch, Soybean oil, Vinegar.",
        containsAllergens: ["sesame seeds", "wheat"],
        mayContainAllergens: [],
      },
      {
        id: "mcchicken-lettuce",
        name: "Lettuce",
        ingredients: "Shredded iceberg lettuce.",
        containsAllergens: [],
        mayContainAllergens: [],
      },
      {
        id: "mcchicken-mayonnaise-style-sauce",
        name: "Mayonnaise-Style Sauce",
        ingredients:
          "Soybean oil, Water, Liquid egg yolk, Vinegar, Sugar, Salt, Mustard seeds, Mustard bran, Xanthan gum, Potassium sorbate, Calcium disodium EDTA.",
        containsAllergens: ["egg", "mustard"],
        mayContainAllergens: [],
      },
    ],
    allergens: ["egg", "mustard", "sesame seeds", "soy", "wheat"],
  },
];

export function getMenuItemsForRestaurantFixture(restaurantId: string) {
  return menuItems.filter((item) => item.restaurantId === restaurantId);
}
