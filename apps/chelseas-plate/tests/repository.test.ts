import { describe, expect, it, vi } from "vitest";
import { deriveAllergens, deriveComponents, getAllergens, mapMenuItem, mapRestaurant } from "@/lib/repository";
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
      allergens: ["mustard", "onion", "sesame seeds", "wheat"],
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
