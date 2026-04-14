import { describe, expect, it } from "vitest";
import { allergenOptions, menuItems, restaurants } from "@/lib/data";
import { filterMenuItems } from "@/lib/filter";

describe("menu filtering", () => {
  it("filters by partial search text", () => {
    const harveysItems = menuItems.filter((item) => item.restaurantId === "harveys");

    const results = filterMenuItems(harveysItems, {
      query: "lettuce",
      excludedAllergens: [],
    });

    expect(results.map((item) => item.name)).toEqual(["Veggie Burger Lettuce Wrap"]);
  });

  it("excludes dishes with one allergen", () => {
    const timsItems = menuItems.filter((item) => item.restaurantId === "tim-hortons");

    const results = filterMenuItems(timsItems, {
      query: "",
      excludedAllergens: ["gluten"],
    });

    expect(results.map((item) => item.name)).toEqual(["Garden Salad"]);
  });

  it("excludes dishes with multiple allergens", () => {
    const awItems = menuItems.filter((item) => item.restaurantId === "a-and-w-canada");

    const results = filterMenuItems(awItems, {
      query: "",
      excludedAllergens: ["eggs", "soy"],
    });

    expect(results.map((item) => item.name)).toEqual(["Onion Rings"]);
  });
});

describe("seeded data integrity", () => {
  it("assigns every menu item to a known restaurant", () => {
    const restaurantIds = new Set(restaurants.map((restaurant) => restaurant.id));

    expect(menuItems.every((item) => restaurantIds.has(item.restaurantId))).toBe(true);
  });

  it("keeps allergen values inside the shared vocabulary", () => {
    const allergenSet = new Set(allergenOptions);

    expect(menuItems.every((item) => item.allergens.every((allergen) => allergenSet.has(allergen)))).toBe(true);
  });
});
