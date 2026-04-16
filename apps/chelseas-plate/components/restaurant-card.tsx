import React from "react";
import Link from "next/link";
import { type Restaurant } from "@/lib/data";

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link className="restaurant-card" href={`/restaurants/${restaurant.slug}`}>
      <div className="restaurant-meta">
        <span>{restaurant.cuisineHint}</span>
        <span>View menu</span>
      </div>
      <h2>{restaurant.name}</h2>
      <p>{restaurant.description}</p>
    </Link>
  );
}
