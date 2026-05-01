"use client";

import React, { useMemo, useState, useEffect } from "react";
import { type MenuItem } from "@/lib/data";

type MenuBrowserProps = {
  items: MenuItem[];
  availableAllergens?: string[];
};

type Group = {
  id: string;
  name: string;
  accent: "sage" | "rose";
  items: MenuItem[];
};

function getFilterOffset() {
  const filter = document.querySelector(".filter");
  const filterH = filter ? filter.getBoundingClientRect().height : 180;
  return filterH + 24;
}

function getClosestSection(groups: Group[]) {
  const offset = getFilterOffset();
  const sectionPositions = groups
    .map((group) => {
      const element = document.getElementById(`sec-${group.id}`);
      if (!element) {
        return null;
      }

      return {
        id: group.id,
        top: element.getBoundingClientRect().top + window.scrollY - offset,
      };
    })
    .filter(Boolean) as { id: string; top: number }[];

  if (sectionPositions.length === 0) {
    return groups[0]?.id ?? "safe";
  }

  const currentY = window.scrollY;
  const currentSection = [...sectionPositions]
    .reverse()
    .find((section) => currentY >= section.top - 2);

  return currentSection?.id ?? sectionPositions[0].id;
}

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

export function MenuBrowser({ items, availableAllergens: availableAllergensProp }: MenuBrowserProps) {
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState("safe");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const availableAllergens = useMemo(() => {
    if (availableAllergensProp && availableAllergensProp.length > 0) {
      return availableAllergensProp;
    }

    return Array.from(new Set(items.flatMap((it) => it.allergens))).sort((a, b) => a.localeCompare(b));
  }, [availableAllergensProp, items]);

  const { safe, skip } = useMemo(
    () => splitItems(items, selectedAllergens, query),
    [items, selectedAllergens, query],
  );

  const groups: Group[] = [{ id: "safe", name: "Safe foods", accent: "sage", items: safe }];
  if (selectedAllergens.length > 0) {
    groups.push({ id: "skip", name: "Skip foods", accent: "rose", items: skip });
  }

  function toggleAllergen(a: string) {
    setSelectedAllergens((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function toggleItem(itemId: string) {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }

  useEffect(() => {
    const updateActiveSection = () => {
      setActiveSection(getClosestSection(groups));
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [groups]);

  function jumpTo(id: string) {
    const el = document.getElementById(`sec-${id}`);
    if (!el) return;
    setActiveSection(id);
    const y = el.getBoundingClientRect().top + window.scrollY - getFilterOffset() + 8;
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
        <MenuSection
          key={group.id}
          group={group}
          excluded={selectedAllergens}
          expandedItems={expandedItems}
          hasExclusions={hasExclusions}
          onToggleItem={toggleItem}
        />
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
  expandedItems,
  hasExclusions,
  onToggleItem,
}: {
  group: Group;
  excluded: string[];
  expandedItems: Record<string, boolean>;
  hasExclusions: boolean;
  onToggleItem: (itemId: string) => void;
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
        const canExpand = item.components.length > 3 || item.components.some((component) => component.ingredients.length > 120);

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
                    Skip · flagged for {hits.slice(0, 2).join(", ")}
                    {hits.length > 2 ? ` +${hits.length - 2}` : ""}
                  </div>
                ))}
              <div className="item-desc">{item.description}</div>
            </div>

            <div className={`item-aside ${expandedItems[item.id] ? "expanded" : "collapsed"}`}>
              <div className="aside-h">Components</div>
              <div className="item-aside-inner">
                {item.components.map((component) => (
                  <div key={component.id} className="component-block">
                    <div className="item-category">{component.name}</div>
                    <div className="ing-list" style={{ marginTop: "4px" }}>
                      {component.ingredients}
                    </div>
                    {component.containsAllergens.length > 0 && (
                      <div className="ing-list" style={{ marginTop: "6px" }}>
                        Contains:{" "}
                        {component.containsAllergens.map((allergen, index) => (
                          <span key={allergen} className={excluded.includes(allergen) ? "ing-hit" : ""}>
                            {allergen}
                            {index < component.containsAllergens.length - 1 ? " · " : ""}
                          </span>
                        ))}
                      </div>
                    )}
                    {component.mayContainAllergens.length > 0 && (
                      <div className="ing-list" style={{ marginTop: "4px" }}>
                        May contain:{" "}
                        {component.mayContainAllergens.map((allergen, index) => (
                          <span key={allergen} className={excluded.includes(allergen) ? "ing-hit" : ""}>
                            {allergen}
                            {index < component.mayContainAllergens.length - 1 ? " · " : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {canExpand ? (
                <button
                  type="button"
                  className="expand-toggle expand-toggle-panel"
                  aria-expanded={expandedItems[item.id] ? "true" : "false"}
                  onClick={() => onToggleItem(item.id)}
                >
                  <span className={`expand-arrow ${expandedItems[item.id] ? "open" : ""}`}>▾</span>
                  {expandedItems[item.id] ? "Show less" : "Show more"}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
