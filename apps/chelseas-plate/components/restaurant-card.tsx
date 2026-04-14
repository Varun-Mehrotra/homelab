import React from "react";
import Link from "next/link";
import { type Restaurant } from "@/lib/data";

type RestaurantCardProps = {
  restaurant: Restaurant;
  menuCount: number;
};

export function RestaurantCard({ restaurant, menuCount }: RestaurantCardProps) {
  return (
    <Link className="restaurant-card" href={`/restaurants/${restaurant.slug}`}>
      <div className="restaurant-meta">
        <span>{restaurant.cuisineHint}</span>
        <span>{menuCount} items</span>
      </div>
      <h2>{restaurant.name}</h2>
      <p>{restaurant.description}</p>
    </Link>
  );
}
