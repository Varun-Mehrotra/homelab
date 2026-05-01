import React from "react";
import { type Restaurant } from "@/lib/data";
import { TransitionLink } from "@/components/transition-link";

type RestaurantCardProps = {
  restaurant: Restaurant;
  index: number;
};

export function RestaurantCard({ restaurant, index }: RestaurantCardProps) {
  const num = String(index + 1).padStart(2, "0");
  const page = (index + 1) * 4 + 8;

  return (
    <TransitionLink className="toc-row" href={`/restaurants/${restaurant.slug}`} direction="forward">
      <div className="toc-num">{num}</div>
      <div>
        <div className="toc-name">{restaurant.name}</div>
        {restaurant.cuisineHint && <div className="toc-tagline">{restaurant.cuisineHint}</div>}
      </div>
      <div className="toc-page">p.&nbsp;{page}</div>
    </TransitionLink>
  );
}
