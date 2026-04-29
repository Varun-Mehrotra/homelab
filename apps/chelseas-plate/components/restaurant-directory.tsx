"use client";

import React, { useState } from "react";
import { type Restaurant } from "@/lib/data";
import { RestaurantCard } from "@/components/restaurant-card";

type RestaurantDirectoryProps = {
  restaurants: Restaurant[];
};

export function RestaurantDirectory({ restaurants }: RestaurantDirectoryProps) {
  const [query, setQuery] = useState("");

  const filtered = restaurants.filter(
    (r) =>
      !query ||
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      (r.cuisineHint ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="toc">
      <div className="toc-h">
        <span>The Index</span>
        <span>{restaurants.length} chains</span>
      </div>
      <div className="toc-search">
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="6.5" cy="6.5" r="4.5" />
          <path d="M10 10l3.5 3.5" />
        </svg>
        <input
          type="search"
          placeholder="Search restaurants…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {filtered.map((restaurant, i) => (
        <RestaurantCard
          key={restaurant.id}
          restaurant={restaurant}
          index={restaurants.indexOf(restaurant)}
        />
      ))}
      {filtered.length === 0 && (
        <div className="empty-note">No restaurants match &ldquo;{query}&rdquo;.</div>
      )}
    </div>
  );
}
