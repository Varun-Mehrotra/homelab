import React from "react";
import { render, screen } from "@testing-library/react";
import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MenuBrowser } from "@/components/menu-browser";
import { RestaurantDirectory } from "@/components/restaurant-directory";
import { getMenuItemsForRestaurantFixture, restaurants } from "@/tests/fixtures";

describe("restaurant directory", () => {
  it("renders the available restaurant list with links", () => {
    render(<RestaurantDirectory restaurants={restaurants} />);

    expect(screen.getByRole("link", { name: /mcdonald's canada/i })).toHaveAttribute(
      "href",
      "/restaurants/mcdonalds-canada",
    );
  });
});

describe("menu browser", () => {
  it("updates results when a user searches", async () => {
    const user = userEvent.setup();
    const restaurant = restaurants.find((entry) => entry.slug === "mcdonalds-canada");

    if (!restaurant) {
      throw new Error("Expected McDonald's Canada fixture data");
    }

    render(
      <MenuBrowser
        items={getMenuItemsForRestaurantFixture(restaurant.id)}
        availableAllergens={["egg", "garlic", "mustard", "onion", "sesame seeds", "soy", "wheat"]}
      />,
    );

    await user.type(screen.getByPlaceholderText(/search dishes/i), "chicken");

    expect(screen.getByRole("heading", { name: /mcchicken/i })).toBeInTheDocument();
    expect(screen.getByText(/mayonnaise-style sauce/i)).toBeInTheDocument();
  });

  it("expands the full components panel on demand", async () => {
    const user = userEvent.setup();
    const restaurant = restaurants.find((entry) => entry.slug === "mcdonalds-canada");

    if (!restaurant) {
      throw new Error("Expected McDonald's Canada fixture data");
    }

    render(
      <MenuBrowser
        items={getMenuItemsForRestaurantFixture(restaurant.id)}
        availableAllergens={["egg", "garlic", "mustard", "onion", "sesame seeds", "soy", "wheat"]}
      />,
    );

    const toggles = screen.getAllByRole("button", { name: /show more/i });
    expect(toggles.length).toBeGreaterThan(0);

    await user.click(toggles[0]);

    expect(screen.getAllByRole("button", { name: /show less/i }).length).toBeGreaterThan(0);
  });

  it("shows skip status when allergens are excluded", async () => {
    const user = userEvent.setup();
    const restaurant = restaurants.find((entry) => entry.slug === "mcdonalds-canada");

    if (!restaurant) {
      throw new Error("Expected McDonald's Canada fixture data");
    }

    render(
      <MenuBrowser
        items={getMenuItemsForRestaurantFixture(restaurant.id)}
        availableAllergens={["egg", "garlic", "mustard", "onion", "sesame seeds", "soy", "wheat"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "sesame seeds" }));
    await user.type(screen.getByPlaceholderText(/search dishes/i), "hamburger");

    expect(screen.getByRole("heading", { name: /hamburger/i })).toBeInTheDocument();
    expect(screen.getByText(/skip · flagged for sesame seeds/i)).toBeInTheDocument();
    expect(screen.getAllByText(/allergen notice/i)).toHaveLength(1);
    expect(screen.getByText(/source-declared may contain:/i)).toBeInTheDocument();
  });

  it("shows safe and skip navigation even when every visible item is safe", async () => {
    const user = userEvent.setup();
    const restaurant = restaurants.find((entry) => entry.slug === "mcdonalds-canada");

    if (!restaurant) {
      throw new Error("Expected McDonald's Canada fixture data");
    }

    render(
      <MenuBrowser
        items={getMenuItemsForRestaurantFixture(restaurant.id)}
        availableAllergens={["egg", "garlic", "mustard", "onion", "sesame seeds", "soy", "wheat"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "garlic" }));

    expect(screen.getByRole("button", { name: /safe foods/i })).toBeInTheDocument();
    const skipButton = screen.getByRole("button", { name: /skip foods/i });
    expect(skipButton).toBeInTheDocument();
    expect(within(skipButton).getByText(/0 to avoid/i)).toBeInTheDocument();
  });

  it("highlights the clicked section button immediately", async () => {
    const user = userEvent.setup();
    const restaurant = restaurants.find((entry) => entry.slug === "mcdonalds-canada");

    if (!restaurant) {
      throw new Error("Expected McDonald's Canada fixture data");
    }

    window.scrollTo = vi.fn();

    render(
      <MenuBrowser
        items={getMenuItemsForRestaurantFixture(restaurant.id)}
        availableAllergens={["egg", "garlic", "mustard", "onion", "sesame seeds", "soy", "wheat"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "sesame seeds" }));

    const safeButton = screen.getByRole("button", { name: /safe foods/i });
    const skipButton = screen.getByRole("button", { name: /skip foods/i });

    expect(safeButton).toBeInTheDocument();

    await user.click(skipButton);

    expect(skipButton.className).toContain("active");
  });

  it("renders direct ingredient items with an Ingredients panel", () => {
    render(
      <MenuBrowser
        items={[
          {
            id: "cheese-danish",
            restaurantId: "starbucks-canada",
            name: "Cheese Danish",
            category: "Bakery",
            description: "Flaky pastry with cheese filling.",
            detailMode: "ingredients",
            components: [],
            ingredients: "Enriched wheat flour, neufchatel cheese, water, butter.",
            containsAllergens: ["milk", "wheat"],
            mayContainAllergens: ["soy"],
            allergens: ["milk", "soy", "wheat"],
          },
        ]}
        availableAllergens={["milk", "soy", "wheat"]}
      />,
    );

    expect(screen.getByText("Ingredients")).toBeInTheDocument();
    expect(screen.getByText(/neufchatel cheese/i)).toBeInTheDocument();
    expect(screen.getByText(/allergen notice/i)).toBeInTheDocument();
    expect(screen.getByText("milk")).toBeInTheDocument();
    expect(screen.getByText("wheat.")).toBeInTheDocument();
    expect(screen.getByText(/source-declared may contain:/i)).toBeInTheDocument();
  });

  it("renders a graceful fallback when no detail source is available", () => {
    render(
      <MenuBrowser
        items={[
          {
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
          },
        ]}
        availableAllergens={["soy", "wheat"]}
      />,
    );

    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText(/pause · ingredient data missing/i)).toBeInTheDocument();
    expect(screen.getByText(/ingredient details unavailable from the current source/i)).toBeInTheDocument();
    expect(screen.getByText(/allergen notice/i)).toBeInTheDocument();
    expect(screen.getByText(/^soy\.$/i)).toBeInTheDocument();
    expect(screen.getByText(/source-declared may contain:/i)).toBeInTheDocument();
  });

  it("places missing-detail items into a pause foods section", () => {
    render(
      <MenuBrowser
        items={[
          {
            id: "apple-chips",
            restaurantId: "starbucks-canada",
            name: "Crispy Apple Chips",
            category: "Lite Bites",
            description: "A simple fruit snack.",
            detailMode: "missing",
            components: [],
            ingredients: undefined,
            containsAllergens: [],
            mayContainAllergens: [],
            allergens: [],
          },
        ]}
        availableAllergens={[]}
      />,
    );

    expect(screen.getByRole("button", { name: /pause foods/i })).toBeInTheDocument();
    expect(screen.getAllByText("Pause foods")).toHaveLength(2);
    expect(screen.getAllByText(/1 to review/i)).toHaveLength(2);
    expect(screen.getByRole("button", { name: /safe foods/i })).toBeInTheDocument();
  });

  it("moves flagged missing-detail items into skip foods when exclusions match", async () => {
    const user = userEvent.setup();

    render(
      <MenuBrowser
        items={[
          {
            id: "apple-chips",
            restaurantId: "starbucks-canada",
            name: "Crispy Apple Chips",
            category: "Lite Bites",
            description: "A simple fruit snack.",
            detailMode: "missing",
            components: [],
            ingredients: undefined,
            containsAllergens: ["soy"],
            mayContainAllergens: [],
            allergens: ["soy"],
          },
        ]}
        availableAllergens={["soy"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "soy" }));

    expect(screen.queryByRole("button", { name: /pause foods/i })).toBeNull();
    expect(screen.getByRole("button", { name: /skip foods/i })).toBeInTheDocument();
    expect(screen.getByText(/skip · flagged for soy/i)).toBeInTheDocument();
  });
});
