#!/usr/bin/env python3
"""Generate Chelsea's Plate seed data from McDonald's Canada menu pages."""

from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

BASE_URL = "https://www.mcdonalds.com"
FULL_MENU_URL = f"{BASE_URL}/ca/en-ca/full-menu.html"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "seed.sql"
CATEGORY_LABELS = {
    "breakfast": "Breakfast",
    "beef": "Beef",
    "chicken": "Chicken",
    "sandwiches-and-wraps": "Sandwiches & Wraps",
    "snacks-and-sides": "Snacks & Sides",
    "desserts-and-shakes": "Desserts & Shakes",
    "drinks": "Beverages",
    "mccafe": "McCafé & Bakery",
    "mcpicks": "McPicks",
    "happy-meal": "Happy Meal",
}
ALLERGEN_ORDER = [
    "barley",
    "egg",
    "fish",
    "milk",
    "mustard",
    "oat",
    "peanuts",
    "rye",
    "sesame seeds",
    "shellfish",
    "soy",
    "sulphites",
    "tree nuts",
    "triticale",
    "wheat",
]
ALLERGEN_MAPPING = {
    "barley": "barley",
    "egg": "egg",
    "fish": "fish",
    "milk": "milk",
    "mustard": "mustard",
    "oat": "oat",
    "peanut": "peanuts",
    "peanuts": "peanuts",
    "rye": "rye",
    "sesame seed": "sesame seeds",
    "sesame seeds": "sesame seeds",
    "shellfish": "shellfish",
    "soy": "soy",
    "sulphites": "sulphites",
    "tree nuts": "tree nuts",
    "triticale": "triticale",
    "wheat": "wheat",
}


def fetch_text(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; ChelseaPlateSeedBot/1.0)",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def fetch_json(url: str) -> dict:
    return json.loads(fetch_text(url))


def slugify(value: str) -> str:
    text = value.lower().strip().replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "item"


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def flatten_text(value) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return ", ".join(part for part in (flatten_text(item) for item in value) if part)
    if isinstance(value, dict):
        return ", ".join(part for part in (flatten_text(item) for item in value.values()) if part)
    return ""


def normalize_allergens(value) -> list[str]:
    cleaned = flatten_text(value).replace("Contains ", "").replace("May Contain ", "").strip().rstrip(".")
    if not cleaned:
        return []

    normalized = set()
    for token in cleaned.split(","):
        key = token.strip().lower()
        mapped = ALLERGEN_MAPPING.get(key)
        if mapped:
            normalized.add(mapped)
    return sorted(normalized)


def ensure_list(value) -> list[dict]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def first_string(*values: str | None) -> str:
    for value in values:
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def get_category_paths() -> list[str]:
    html = fetch_text(FULL_MENU_URL)
    paths = re.findall(r'href="(/ca/en-ca/full-menu/[^"#?]+\.html)"', html)
    unique_paths = []
    seen = set()
    for path in paths:
        slug = path.rsplit("/", 1)[-1].replace(".html", "")
        if slug not in CATEGORY_LABELS:
            continue
        if path not in seen:
            seen.add(path)
            unique_paths.append(path)
    return unique_paths


def get_product_paths(category_path: str) -> list[str]:
    html = fetch_text(urllib.parse.urljoin(BASE_URL, category_path))
    paths = re.findall(r'href="(/ca/en-ca/product/[^"#?]+\.html)"', html)
    unique_paths = []
    seen = set()
    for path in paths:
        if path not in seen:
            seen.add(path)
            unique_paths.append(path)
    return unique_paths


def get_product_id(product_html: str) -> str:
    match = re.search(r'data-product-id="(\d+)"', product_html)
    if not match:
        raise RuntimeError("Unable to find product id on menu item page.")
    return match.group(1)


def get_item_details(product_path: str) -> dict:
    product_html = fetch_text(urllib.parse.urljoin(BASE_URL, product_path))
    product_id = get_product_id(product_html)
    query = urllib.parse.urlencode(
        {
            "country": "ca",
            "language": "en",
            "showLiveData": "true",
            "item": product_id,
        }
    )
    return fetch_json(f"{BASE_URL}/dnaapp/itemDetails?{query}")["item"]


def collect_menu_items() -> list[dict]:
    items = []
    seen_ids = set()

    for category_path in get_category_paths():
        category_slug = category_path.rsplit("/", 1)[-1].replace(".html", "")

        for product_path in get_product_paths(category_path):
            details = get_item_details(product_path)
            item_id = product_path.rsplit("/", 1)[-1].replace(".html", "")
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            item = details.get("item", details)
            components_root = item.get("components", {})
            components = ensure_list(components_root.get("component"))
            items.append(
                {
                    "id": item_id,
                    "name": first_string(item.get("item_marketing_name"), item.get("item_name"), item_id),
                    "description": first_string(item.get("description")),
                    "category": CATEGORY_LABELS.get(category_slug, category_slug.replace("-", " ").title()),
                    "components": components,
                }
            )

    return items


def build_seed_sql(items: list[dict]) -> str:
    ingredients: dict[str, dict[str, object]] = {}
    menu_links: set[tuple[str, str]] = set()

    menu_value_rows = []
    for sort_order, item in enumerate(items, start=1):
        menu_value_rows.append(
            "  ({id}, 'mcdonalds-canada', {name}, {category}, {description}, {sort_order})".format(
                id=sql_quote(item["id"]),
                name=sql_quote(item["name"]),
                category=sql_quote(item["category"]),
                description=sql_quote(item["description"]),
                sort_order=sort_order,
            )
        )

        for component in item["components"]:
            ingredient_name = first_string(
                component.get("product_marketing_name"),
                component.get("product_name"),
                component.get("imported_product_name"),
            )
            if not ingredient_name:
                continue

            ingredient_id = slugify(ingredient_name)
            ingredient_entry = ingredients.setdefault(
                ingredient_id,
                {
                    "name": ingredient_name,
                    "allergens": set(),
                },
            )
            ingredient_entry["allergens"].update(normalize_allergens(component.get("product_allergen", "")))
            menu_links.add((item["id"], ingredient_id))

    observed_allergens = [
        allergen
        for allergen in ALLERGEN_ORDER
        if any(allergen in entry["allergens"] for entry in ingredients.values())
    ]

    ingredient_rows = [
        f"  ({sql_quote(ingredient_id)}, {sql_quote(entry['name'])})"
        for ingredient_id, entry in sorted(ingredients.items(), key=lambda pair: str(pair[1]["name"]).lower())
    ]
    menu_link_rows = [
        f"  ({sql_quote(menu_item_id)}, {sql_quote(ingredient_id)})"
        for menu_item_id, ingredient_id in sorted(menu_links)
    ]
    ingredient_allergen_rows = []
    for ingredient_id, entry in sorted(ingredients.items(), key=lambda pair: str(pair[1]["name"]).lower()):
        for allergen in sorted(entry["allergens"]):
            ingredient_allergen_rows.append(
                f"  ({sql_quote(ingredient_id)}, {sql_quote(slugify(allergen))})"
            )

    lines = [
        "-- Generated from McDonald's Canada menu and item detail pages.",
        f"-- Source: {FULL_MENU_URL}",
        "truncate table ingredient_allergens, menu_item_ingredients, menu_items, ingredients, allergens, restaurants restart identity cascade;",
        "",
        "insert into restaurants (id, slug, name, description, cuisine_hint, sort_order) values",
        "  ('mcdonalds-canada', 'mcdonalds-canada', 'McDonald''s Canada', 'Live McDonald''s Canada menu data sourced from current product pages and ingredient details.', 'Burgers, breakfast, chicken, beverages, desserts, and more', 1);",
        "",
        "insert into allergens (id, name) values",
        ",\n".join(f"  ({sql_quote(slugify(allergen))}, {sql_quote(allergen)})" for allergen in observed_allergens),
        ";",
        "",
        "insert into ingredients (id, name) values",
        ",\n".join(ingredient_rows),
        ";",
        "",
        "insert into menu_items (id, restaurant_id, name, category, description, sort_order) values",
        ",\n".join(menu_value_rows),
        ";",
        "",
        "insert into menu_item_ingredients (menu_item_id, ingredient_id) values",
        ",\n".join(menu_link_rows),
        ";",
        "",
        "insert into ingredient_allergens (ingredient_id, allergen_id) values",
        ",\n".join(ingredient_allergen_rows),
        ";",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    items = collect_menu_items()
    OUTPUT_PATH.write_text(build_seed_sql(items), encoding="utf-8")
    print(f"Wrote {len(items)} menu items to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
