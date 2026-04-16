"use client";

import React, { useMemo, useState } from "react";
import { type Allergen, type MenuItem, type Restaurant } from "@/lib/data";
import { filterMenuItems, summarizeDishSafety } from "@/lib/filter";

type MenuBrowserProps = {
  restaurant: Restaurant;
  items: MenuItem[];
};

export function MenuBrowser({ restaurant, items }: MenuBrowserProps) {
  const [query, setQuery] = useState("");
  const [selectedAllergens, setSelectedAllergens] = useState<Allergen[]>([]);
  const restaurantPossessive = restaurant.name.endsWith("'s")
    ? restaurant.name
    : restaurant.name.endsWith("s")
      ? `${restaurant.name}'`
      : `${restaurant.name}'s`;
  const availableAllergens = useMemo(
    () =>
      Array.from(new Set(items.flatMap((item) => item.allergens))).sort((left, right) => left.localeCompare(right)),
    [items],
  );

  const filteredItems = useMemo(
    () =>
      filterMenuItems(items, {
        query,
        excludedAllergens: selectedAllergens,
      }),
    [items, query, selectedAllergens],
  );

  function toggleAllergen(allergen: Allergen) {
    setSelectedAllergens((current) =>
      current.includes(allergen)
        ? current.filter((item) => item !== allergen)
        : [...current, allergen],
    );
  }

  return (
    <>
      <section className="filter-panel">
        <div className="filter-layout">
          <div>
            <label className="field-label" htmlFor="dish-search">
              Search {restaurantPossessive} menu
            </label>
            <input
              id="dish-search"
              className="search-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try fries, wrap, salad, burger..."
            />
          </div>
          <div>
            <span className="field-label">Exclude allergens</span>
            <div className="allergen-grid">
              {availableAllergens.map((allergen) => (
                <label key={allergen} className="checkbox-card">
                  <input
                    type="checkbox"
                    checked={selectedAllergens.includes(allergen)}
                    onChange={() => toggleAllergen(allergen)}
                  />
                  <span>{allergen}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        {selectedAllergens.length > 0 ? (
          <div className="chip-row" style={{ marginTop: "18px" }}>
            {selectedAllergens.map((allergen) => (
              <span key={allergen} className="filter-chip">
                Excluding {allergen}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section>
        <div className="section-heading">
          <div>
            <h2>
              {filteredItems.length} {filteredItems.length === 1 ? "dish" : "dishes"} available at a glance
            </h2>
            <p className="muted">
              Chelsea&apos;s Plate filters out listed allergens, but always double-check with the restaurant before
              ordering.
            </p>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="empty-state">
            No dishes match your search and allergen filters right now. Try clearing one allergen or searching for a
            broader term.
          </div>
        ) : (
          <div className="results-grid">
            {filteredItems.map((item) => {
              const safety = summarizeDishSafety(item, selectedAllergens);

              return (
                <article key={item.id} className="result-card">
                  <div className="result-topline">
                    <div>
                      <p className="muted" style={{ marginTop: 0 }}>
                        {item.category}
                      </p>
                      <h3>{item.name}</h3>
                    </div>
                    <span className={`status-pill ${safety.tone}`}>{safety.label}</span>
                  </div>
                  <p>{item.description}</p>
                  <p className="muted" style={{ marginTop: "14px" }}>
                    Ingredients: {item.ingredients.join(", ")}
                  </p>
                  <div className="result-tags" style={{ marginTop: "14px" }}>
                    {item.allergens.length > 0 ? (
                      item.allergens.map((allergen) => (
                        <span key={allergen} className="tag">
                          {allergen}
                        </span>
                      ))
                    ) : (
                      <span className="tag">No listed major allergens</span>
                    )}
                  </div>
                  <p className="muted" style={{ marginTop: "14px" }}>
                    {safety.summary}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
