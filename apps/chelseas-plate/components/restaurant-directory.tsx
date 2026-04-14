import React from "react";
import { getMenuItemsForRestaurant, type Restaurant } from "@/lib/data";
import { RestaurantCard } from "@/components/restaurant-card";

type RestaurantDirectoryProps = {
  restaurants: Restaurant[];
};

export function RestaurantDirectory({ restaurants }: RestaurantDirectoryProps) {
  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>Choose a restaurant</h2>
          <p className="muted">Start with the menu you are about to order from.</p>
        </div>
      </div>
      <div className="restaurant-grid">
        {restaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            menuCount={getMenuItemsForRestaurant(restaurant.id).length}
          />
        ))}
      </div>
    </section>
  );
}
