"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { type MenuItem } from "@/lib/data";

type MenuBrowserProps = {
  items: MenuItem[];
};

type Group = {
  id: string;
  name: string;
  accent: "sage" | "rose";
  items: MenuItem[];
};

function splitItems(items: MenuItem[], excluded: string[], query: string) {
  const q = query.trim().toLowerCase();
  const base = q
    ? items.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          it.description.toLowerCase().includes(q) ||
          it.category.toLowerCase().includes(q),
      )
    : items;

  if (excluded.length === 0) {
    return { safe: base, skip: [] };
  }

  const safe = base.filter((it) => excluded.every((exc) => !it.allergens.includes(exc)));
  const skip = base.filter((it) => excluded.some((exc) => it.allergens.includes(exc)));
  return { safe, skip };
}

export function MenuBrowser({ items }: MenuBrowserProps) {
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState("safe");

  const availableAllergens = useMemo(
    () => Array.from(new Set(items.flatMap((it) => it.allergens))).sort((a, b) => a.localeCompare(b)),
    [items],
  );

  const { safe, skip } = useMemo(
    () => splitItems(items, selectedAllergens, query),
    [items, selectedAllergens, query],
  );

  const groups: Group[] = [{ id: "safe", name: "Safe foods", accent: "sage", items: safe }];
  if (selectedAllergens.length > 0 && skip.length > 0) {
    groups.push({ id: "skip", name: "Skip foods", accent: "rose", items: skip });
  }

  function toggleAllergen(a: string) {
    setSelectedAllergens((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  // Scrollspy
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = groups.map((g) => document.getElementById(`sec-${g.id}`)).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveSection(visible[0].target.id.replace(/^sec-/, ""));
        }
      },
      { rootMargin: "-200px 0px -55% 0px", threshold: 0 },
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [groups.length, selectedAllergens.join(",")]);

  function jumpTo(id: string) {
    const el = document.getElementById(`sec-${id}`);
    if (!el) return;
    const filter = document.querySelector(".filter");
    const filterH = filter ? filter.getBoundingClientRect().height : 180;
    const y = el.getBoundingClientRect().top + window.scrollY - filterH - 16;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  const hasExclusions = selectedAllergens.length > 0;

  return (
    <>
      <div className="filter">
        <div className="filter-head">
          <span className="filter-label">Avoid</span>
          {hasExclusions && (
            <span className="filter-stats">
              <span className="ct ct-safe">{safe.length}</span> safe ·{" "}
              <span className="ct ct-skip">{skip.length}</span> to skip
            </span>
          )}
          {hasExclusions && (
            <button className="filter-clear" onClick={() => setSelectedAllergens([])}>
              Clear all
            </button>
          )}
        </div>

        <div className="filter-search">
          <svg width="13" height="13" viewBox="0 0 15 15" fill="none" stroke="rgba(239,231,216,0.5)" strokeWidth="1.6">
            <circle cx="6.5" cy="6.5" r="4.5" />
            <path d="M10 10l3.5 3.5" />
          </svg>
          <input
            type="search"
            placeholder="Search dishes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="chips">
          {availableAllergens.map((allergen) => (
            <button
              key={allergen}
              className={`chip ${selectedAllergens.includes(allergen) ? "on" : ""}`}
              onClick={() => toggleAllergen(allergen)}
            >
              {allergen}
              {selectedAllergens.includes(allergen) && <span className="chip-x">×</span>}
            </button>
          ))}
        </div>

        {groups.length > 1 && (
          <div className="sec-nav">
            {groups.map((g) => (
              <button
                key={g.id}
                className={`sec-nav-btn acc-${g.accent} ${activeSection === g.id ? "active" : ""}`}
                onClick={() => jumpTo(g.id)}
              >
                <span className="sec-nav-letter">{g.name[0]}</span>
                <span className="sec-nav-text">
                  <span className="sec-nav-name">{g.name}</span>
                  <span className="sec-nav-count">
                    {g.id === "skip" ? `${g.items.length} to avoid` : `${g.items.length} available`}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {groups.map((group) => (
        <MenuSection key={group.id} group={group} excluded={selectedAllergens} hasExclusions={hasExclusions} />
      ))}

      {safe.length === 0 && skip.length === 0 && (
        <div className="empty-note">No dishes match your search. Try a broader term.</div>
      )}

      <div className="colophon">
        Set in DM Serif Display &amp; Cormorant Garamond. Printed digitally.
        <br />
        Allergen guidance is general; individual sensitivities vary. Always confirm with the restaurant before ordering.
      </div>
    </>
  );
}

function MenuSection({
  group,
  excluded,
  hasExclusions,
}: {
  group: Group;
  excluded: string[];
  hasExclusions: boolean;
}) {
  return (
    <div className="menu-section" id={`sec-${group.id}`}>
      <div className="section-head">
        <div className={`section-letter section-letter-${group.accent}`}>{group.name[0]}</div>
        <div className="section-meta">
          <div className="section-eyebrow">
            {group.items.length} {group.id === "skip" ? "to avoid" : "available"}
          </div>
          <div className="section-name">{group.name}</div>
        </div>
      </div>

      {group.items.map((item) => {
        const hits = excluded.filter((exc) => item.allergens.includes(exc));
        const isSafe = hits.length === 0;

        return (
          <div key={item.id} className={`item ${!isSafe ? "dim" : ""}`}>
            <div className="item-main">
              <div className="item-head">
                <h3 className="item-name">{item.name}</h3>
                <div className="leader" />
              </div>
              <div className="item-category">{item.category}</div>
              {hasExclusions &&
                (isSafe ? (
                  <div className="status-line status-safe">
                    <span className="status-dot" />
                    Safe to order
                  </div>
                ) : (
                  <div className="status-line status-skip">
                    <span className="status-dot" />
                    Skip · contains {hits.slice(0, 2).join(", ")}
                    {hits.length > 2 ? ` +${hits.length - 2}` : ""}
                  </div>
                ))}
              <div className="item-desc">{item.description}</div>
            </div>

            <div className="item-aside">
              <div className="aside-h">Ingredients</div>
              <div className="ing-list">
                {item.ingredients.map((ing, i) => (
                  <span key={i} className={excluded.some((exc) => ing.toLowerCase().includes(exc)) ? "ing-hit" : ""}>
                    {ing}
                    {i < item.ingredients.length - 1 ? " · " : ""}
                  </span>
                ))}
              </div>
              {item.allergens.length > 0 && (
                <>
                  <div className="aside-h" style={{ marginTop: "12px" }}>
                    Allergens
                  </div>
                  <div className="ing-list">
                    {item.allergens.map((a, i) => (
                      <span key={i} className={excluded.includes(a) ? "ing-hit" : ""}>
                        {a}
                        {i < item.allergens.length - 1 ? " · " : ""}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
