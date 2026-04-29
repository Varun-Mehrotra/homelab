import React from "react";
import Link from "next/link";
import { type Restaurant } from "@/lib/data";

type RestaurantCardProps = {
  restaurant: Restaurant;
  index: number;
};

export function RestaurantCard({ restaurant, index }: RestaurantCardProps) {
  const num = String(index + 1).padStart(2, "0");
  const page = (index + 1) * 4 + 8;

  return (
    <Link className="toc-row" href={`/restaurants/${restaurant.slug}`}>
      <div className="toc-num">{num}</div>
      <div>
        <div className="toc-name">{restaurant.name}</div>
        {restaurant.cuisineHint && <div className="toc-tagline">{restaurant.cuisineHint}</div>}
      </div>
      <div className="toc-page">p.&nbsp;{page}</div>
    </Link>
  );
}
