import { describe, expect, it } from "vitest";
import { allAllergens, menuItems, restaurants } from "@/tests/fixtures";
import { filterMenuItems } from "@/lib/filter";

describe("menu filtering", () => {
  it("filters by partial search text", () => {
    const mcdonaldsItems = menuItems.filter((item) => item.restaurantId === "mcdonalds-canada");

    const results = filterMenuItems(mcdonaldsItems, {
      query: "desserts",
      excludedAllergens: [],
    });

    expect(results.map((item) => item.name)).toEqual(["Vanilla Cone"]);
  });

  it("excludes dishes with one allergen", () => {
    const mcdonaldsItems = menuItems.filter((item) => item.restaurantId === "mcdonalds-canada");

    const results = filterMenuItems(mcdonaldsItems, {
      query: "",
      excludedAllergens: ["fish"],
    });

    expect(results.map((item) => item.name)).toEqual([
      "Big Mac",
      "Egg McMuffin",
      "Small French Fries",
      "Vanilla Cone",
    ]);
  });

  it("excludes dishes with multiple allergens", () => {
    const mcdonaldsItems = menuItems.filter((item) => item.restaurantId === "mcdonalds-canada");

    const results = filterMenuItems(mcdonaldsItems, {
      query: "",
      excludedAllergens: ["milk", "soy"],
    });

    expect(results.map((item) => item.name)).toEqual(["Small French Fries"]);
  });
});

describe("fixture data integrity", () => {
  it("assigns every menu item to a known restaurant", () => {
    const restaurantIds = new Set(restaurants.map((restaurant) => restaurant.id));

    expect(menuItems.every((item) => restaurantIds.has(item.restaurantId))).toBe(true);
  });

  it("keeps allergen values inside the shared vocabulary", () => {
    const allergenSet = new Set(allAllergens);

    expect(menuItems.every((item) => item.allergens.every((allergen) => allergenSet.has(allergen)))).toBe(true);
  });
});
