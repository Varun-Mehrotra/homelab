import { describe, expect, it } from "vitest";
import { deriveAllergens, deriveIngredients, mapMenuItem, mapRestaurant } from "@/lib/repository";

describe("repository shaping", () => {
  it("maps restaurant rows into UI-facing restaurant data", () => {
    expect(
      mapRestaurant({
        id: "mcdonalds-canada",
        name: "McDonald's Canada",
        slug: "mcdonalds-canada",
        description: "Current McDonald's Canada menu data sourced from product pages.",
        cuisine_hint: "Burgers, breakfast, chicken, beverages, desserts, and more",
      }),
    ).toEqual({
      id: "mcdonalds-canada",
      name: "McDonald's Canada",
      slug: "mcdonalds-canada",
      description: "Current McDonald's Canada menu data sourced from product pages.",
      cuisineHint: "Burgers, breakfast, chicken, beverages, desserts, and more",
    });
  });

  it("derives sorted ingredient and allergen lists from nested ingredient joins", () => {
    const row = {
      id: "big-mac-sandwich",
      restaurant_id: "mcdonalds-canada",
      name: "Big Mac",
      category: "Beef",
      description: "Two beef patties with Big Mac sauce, cheese, pickles, and lettuce on a sesame bun.",
      menu_item_ingredients: [
        {
          ingredient: {
            id: "processed-cheese",
            name: "processed cheese",
            ingredient_allergens: [{ allergen: { name: "milk" } }, { allergen: { name: "soy" } }],
          },
        },
        {
          ingredient: {
            id: "big-mac-sauce",
            name: "big mac sauce",
            ingredient_allergens: [
              { allergen: { name: "egg" } },
              { allergen: { name: "mustard" } },
              { allergen: { name: "soy" } },
              { allergen: { name: "wheat" } },
            ],
          },
        },
        {
          ingredient: {
            id: "big-mac-bun",
            name: "big mac bun",
            ingredient_allergens: [{ allergen: { name: "sesame seeds" } }, { allergen: { name: "wheat" } }],
          },
        },
      ],
    };

    expect(deriveIngredients(row)).toEqual(["big mac bun", "big mac sauce", "processed cheese"]);
    expect(deriveAllergens(row)).toEqual(["egg", "milk", "mustard", "sesame seeds", "soy", "wheat"]);
    expect(mapMenuItem(row)).toEqual({
      id: "big-mac-sandwich",
      restaurantId: "mcdonalds-canada",
      name: "Big Mac",
      category: "Beef",
      description: "Two beef patties with Big Mac sauce, cheese, pickles, and lettuce on a sesame bun.",
      ingredients: ["big mac bun", "big mac sauce", "processed cheese"],
      allergens: ["egg", "milk", "mustard", "sesame seeds", "soy", "wheat"],
    });
  });
});
