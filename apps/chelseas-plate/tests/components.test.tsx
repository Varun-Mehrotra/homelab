import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MenuBrowser } from "@/components/menu-browser";
import { RestaurantDirectory } from "@/components/restaurant-directory";
import { getMenuItemsForRestaurant, restaurants } from "@/lib/data";

describe("restaurant directory", () => {
  it("renders the seeded restaurant list with links", () => {
    render(<RestaurantDirectory restaurants={restaurants} />);

    expect(screen.getByRole("link", { name: /tim hortons/i })).toHaveAttribute(
      "href",
      "/restaurants/tim-hortons",
    );
    expect(screen.getByRole("link", { name: /new york fries/i })).toHaveAttribute(
      "href",
      "/restaurants/new-york-fries",
    );
  });
});

describe("menu browser", () => {
  it("updates results when a user searches", async () => {
    const user = userEvent.setup();
    const restaurant = restaurants.find((entry) => entry.slug === "mary-browns");

    if (!restaurant) {
      throw new Error("Expected Mary Brown's seed data");
    }

    render(<MenuBrowser restaurant={restaurant} items={getMenuItemsForRestaurant(restaurant.id)} />);

    await user.type(screen.getByRole("searchbox", { name: /search mary brown's menu/i }), "wrap");

    expect(screen.getByRole("heading", { name: /1 dish available at a glance/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /spicy chicken wrap/i })).toBeInTheDocument();
  });

  it("shows an empty state when filters remove every dish", async () => {
    const user = userEvent.setup();
    const restaurant = restaurants.find((entry) => entry.slug === "new-york-fries");

    if (!restaurant) {
      throw new Error("Expected New York Fries seed data");
    }

    render(<MenuBrowser restaurant={restaurant} items={getMenuItemsForRestaurant(restaurant.id)} />);

    await user.click(screen.getByLabelText("milk"));
    await user.click(screen.getByLabelText("soy"));
    await user.type(screen.getByRole("searchbox", { name: /search new york fries' menu/i }), "poutine");

    expect(screen.getByText(/no dishes match your search and allergen filters/i)).toBeInTheDocument();
  });
});
