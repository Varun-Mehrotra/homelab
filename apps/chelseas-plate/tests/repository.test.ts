import { describe, expect, it, vi } from "vitest";
import {
  deriveAllergens,
  deriveComponents,
  deriveItemLevelAllergens,
  getAllergens,
  mapMenuItem,
  mapRestaurant,
} from "@/lib/repository";
import * as supabaseModule from "@/lib/supabase";

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

  it("derives components and allergen lists from nested component joins", () => {
    const row = {
      id: "hamburger",
      restaurant_id: "mcdonalds-canada",
      name: "Hamburger",
      category: "Beef",
      description: "A classic beef burger with pickles, ketchup, mustard, onions, and a toasted bun.",
      ingredient_statement: null,
      menu_item_allergens: [],
      item_components: [
        {
          id: "hamburger-regular-bun",
          name: "Regular Bun",
          ingredient_statement: "Enriched wheat flour, Water, Sugars, Yeast.",
          sort_order: 1,
          item_component_allergens: [
            { relation_type: "contains", allergen: { name: "wheat" } },
            { relation_type: "may_contain", allergen: { name: "sesame seeds" } },
          ],
        },
        {
          id: "hamburger-mustard",
          name: "Mustard",
          ingredient_statement: "Water, Vinegar, Mustard seed, Onion powder, Salt.",
          sort_order: 2,
          item_component_allergens: [{ relation_type: "contains", allergen: { name: "mustard" } }],
        },
      ],
    };

    expect(deriveComponents(row)).toEqual([
      {
        id: "hamburger-regular-bun",
        name: "Regular Bun",
        ingredients: "Enriched wheat flour, Water, Sugars, Yeast.",
        containsAllergens: ["wheat"],
        mayContainAllergens: ["sesame seeds"],
      },
      {
        id: "hamburger-mustard",
        name: "Mustard",
        ingredients: "Water, Vinegar, Mustard seed, Onion powder, Salt.",
        containsAllergens: ["mustard", "onion"],
        mayContainAllergens: [],
      },
    ]);
    expect(deriveAllergens(row)).toEqual(["mustard", "onion", "sesame seeds", "wheat"]);
    expect(mapMenuItem(row)).toEqual({
      id: "hamburger",
      restaurantId: "mcdonalds-canada",
      name: "Hamburger",
      category: "Beef",
      description: "A classic beef burger with pickles, ketchup, mustard, onions, and a toasted bun.",
      detailMode: "components",
      components: [
        {
          id: "hamburger-regular-bun",
          name: "Regular Bun",
          ingredients: "Enriched wheat flour, Water, Sugars, Yeast.",
          containsAllergens: ["wheat"],
          mayContainAllergens: ["sesame seeds"],
        },
        {
          id: "hamburger-mustard",
          name: "Mustard",
          ingredients: "Water, Vinegar, Mustard seed, Onion powder, Salt.",
          containsAllergens: ["mustard", "onion"],
          mayContainAllergens: [],
        },
      ],
      ingredients: undefined,
      containsAllergens: [],
      mayContainAllergens: [],
      allergens: ["mustard", "onion", "sesame seeds", "wheat"],
    });
  });

  it("falls back to direct ingredients when an item has no components", () => {
    const row = {
      id: "cheese-danish",
      restaurant_id: "starbucks-canada",
      name: "Cheese Danish",
      category: "Bakery",
      description: "Flaky, butter croissant dough with soft, warm cheese in the center.",
      ingredient_statement:
        "Enriched wheat flour, neufchatel cheese, water, butter, sugar, garlic powder.",
      menu_item_allergens: [
        { relation_type: "contains", allergen: { name: "egg" } },
        { relation_type: "contains", allergen: { name: "wheat" } },
        { relation_type: "may_contain", allergen: { name: "soy" } },
      ],
      item_components: [],
    };

    expect(deriveComponents(row)).toEqual([]);
    expect(deriveItemLevelAllergens(row)).toEqual({
      containsAllergens: ["egg", "garlic", "wheat"],
      mayContainAllergens: ["soy"],
    });
    expect(deriveAllergens(row)).toEqual(["egg", "garlic", "soy", "wheat"]);
    expect(mapMenuItem(row)).toEqual({
      id: "cheese-danish",
      restaurantId: "starbucks-canada",
      name: "Cheese Danish",
      category: "Bakery",
      description: "Flaky, butter croissant dough with soft, warm cheese in the center.",
      detailMode: "ingredients",
      components: [],
      ingredients: "Enriched wheat flour, neufchatel cheese, water, butter, sugar, garlic powder.",
      containsAllergens: ["egg", "garlic", "wheat"],
      mayContainAllergens: ["soy"],
      allergens: ["egg", "garlic", "soy", "wheat"],
    });
  });

  it("returns missing mode when neither components nor direct ingredients are present", () => {
    const row = {
      id: "apple-chips",
      restaurant_id: "starbucks-canada",
      name: "Crispy Apple Chips",
      category: "Lite Bites",
      description: "A simple fruit snack.",
      ingredient_statement: null,
      menu_item_allergens: [
        { relation_type: "contains", allergen: { name: "soy" } },
        { relation_type: "may_contain", allergen: { name: "wheat" } },
      ],
      item_components: [],
    };

    expect(mapMenuItem(row)).toEqual({
      id: "apple-chips",
      restaurantId: "starbucks-canada",
      name: "Crispy Apple Chips",
      category: "Lite Bites",
      description: "A simple fruit snack.",
      detailMode: "missing",
      components: [],
      ingredients: undefined,
      containsAllergens: ["soy"],
      mayContainAllergens: ["wheat"],
      allergens: ["soy", "wheat"],
    });
  });

  it("merges database allergens with the always-on selector extras", async () => {
    const fromSpy = vi.spyOn(supabaseModule, "getSupabaseServerClient").mockReturnValue({
      from() {
        return {
          select() {
            return {
              order() {
                return Promise.resolve({
                  data: [{ name: "egg" }, { name: "wheat" }],
                  error: null,
                });
              },
            };
          },
        };
      },
    } as never);

    await expect(getAllergens()).resolves.toEqual(["egg", "garlic", "msg", "onion", "wheat"]);
    fromSpy.mockRestore();
  });
});
