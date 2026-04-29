import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
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

    render(<MenuBrowser items={getMenuItemsForRestaurantFixture(restaurant.id)} />);

    await user.type(screen.getByPlaceholderText(/search dishes/i), "cone");

    expect(screen.getByRole("heading", { name: /vanilla cone/i })).toBeInTheDocument();
  });

  it("shows skip status when allergens are excluded", async () => {
    const user = userEvent.setup();
    const restaurant = restaurants.find((entry) => entry.slug === "mcdonalds-canada");

    if (!restaurant) {
      throw new Error("Expected McDonald's Canada fixture data");
    }

    render(<MenuBrowser items={getMenuItemsForRestaurantFixture(restaurant.id)} />);

    await user.click(screen.getByRole("button", { name: "milk" }));
    await user.click(screen.getByRole("button", { name: "soy" }));
    await user.type(screen.getByPlaceholderText(/search dishes/i), "cone");

    expect(screen.getByRole("heading", { name: /vanilla cone/i })).toBeInTheDocument();
    expect(screen.getByText(/skip · contains milk/i)).toBeInTheDocument();
  });
});
