#!/usr/bin/env python3
"""Generate Chelsea's Plate seed data from McDonald's Canada menu pages."""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.parse
import urllib.error
import urllib.request
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

BASE_URL = "https://www.mcdonalds.com"
FULL_MENU_URL = f"{BASE_URL}/ca/en-ca/full-menu.html"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "seed.sql"
MAX_WORKERS = 4
MAX_RETRIES = 4

CATEGORY_LABELS = {
    "breakfast": "Breakfast",
    "beef": "Beef",
    "chicken": "Chicken",
    "sandwiches-and-wraps": "Sandwiches & Wraps",
    "snacks-and-sides": "Snacks & Sides",
    "desserts-and-shakes": "Desserts & Shakes",
    "drinks": "Beverages",
    "mccafe": "McCafe & Bakery",
    "mcpicks": "McPicks",
    "happy-meal": "Happy Meal",
}

EXTRA_SELECTOR_ALLERGENS = ["garlic", "msg", "onion"]

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
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (compatible; ChelseaPlateSeedBot/2.0)"},
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read().decode("utf-8")
        except urllib.error.HTTPError as error:
            last_error = error
            if error.code in {403, 429} and attempt < MAX_RETRIES:
                time.sleep(attempt * 2)
                continue
            raise
        except urllib.error.URLError as error:
            last_error = error
            if attempt < MAX_RETRIES:
                time.sleep(attempt * 2)
                continue
            raise

    raise RuntimeError(f"Failed to fetch {url}: {last_error}")


def fetch_json(url: str) -> dict:
    return json.loads(fetch_text(url))


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def slugify(value: str) -> str:
    text = value.lower().strip().replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "item"


def flatten_text(value) -> str:
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        return ", ".join(part for part in (flatten_text(item) for item in value) if part)
    if isinstance(value, dict):
        return ", ".join(part for part in (flatten_text(item) for item in value.values()) if part)
    return ""


def ensure_list(value) -> list[dict]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def first_string(*values) -> str:
    for value in values:
        text = normalize_text(flatten_text(value))
        if text:
            return text
    return ""


def normalize_text(value: str) -> str:
    if not value:
        return ""

    normalized = (
        value.replace("â€\"", " - ")
        .replace("â€¦", "...")
        .replace("â€˜", "'")
        .replace("â€", "'")
        .replace("Ã©", "e")
        .replace("α", "alpha")
        .replace("\u00a0", " ")
        .replace("\u2019", "'")
        .replace("\u2018", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u00ae", "")
        .replace("\u2122", "")
        .replace("\u00c2", "")
        .replace("\u2013", "-")
        .replace("\u2026", "...")
    )
    normalized = unicodedata.normalize("NFKD", normalized).encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.strip()


def validate_sql_output(sql: str) -> None:
    if any(ord(char) > 127 for char in sql):
        raise RuntimeError("Generated SQL contains non-ASCII characters.")

    in_string = False
    for raw_line in sql.splitlines():
        line = raw_line.lstrip()
        if line.startswith("--"):
            continue

        index = 0
        while index < len(raw_line):
            char = raw_line[index]
            if char != "'":
                index += 1
                continue

            next_char = raw_line[index + 1] if index + 1 < len(raw_line) else ""
            if in_string and next_char == "'":
                index += 2
                continue

            in_string = not in_string
            index += 1

    if in_string:
        raise RuntimeError("Generated SQL contains an unterminated string literal.")


def normalize_allergens(value) -> list[str]:
    cleaned = flatten_text(value)
    if not cleaned:
        return []

    cleaned = (
        cleaned.replace("Contains ", "")
        .replace("May Contain ", "")
        .replace("May contain ", "")
        .replace("Contains:", "")
        .replace("May Contain:", "")
        .replace("May contain:", "")
        .strip()
        .rstrip(".")
    )
    if not cleaned:
        return []

    normalized = set()
    for token in cleaned.split(","):
        key = token.strip().lower().rstrip(".")
        mapped = ALLERGEN_MAPPING.get(key)
        if mapped:
            normalized.add(mapped)
    return sorted(normalized)


def dedupe_paths(paths: list[str]) -> list[str]:
    unique = []
    seen = set()
    for path in paths:
        if path not in seen:
            seen.add(path)
            unique.append(path)
    return unique


def get_category_paths() -> list[str]:
    html = fetch_text(FULL_MENU_URL)
    paths = re.findall(r'href="(/ca/en-ca/full-menu/[^"#?]+\.html)"', html)
    return [path for path in dedupe_paths(paths) if path.rsplit("/", 1)[-1].replace(".html", "") in CATEGORY_LABELS]


def get_product_paths(category_path: str) -> list[str]:
    html = fetch_text(urllib.parse.urljoin(BASE_URL, category_path))
    return dedupe_paths(re.findall(r'href="(/ca/en-ca/product/[^"#?]+\.html)"', html))


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


def collect_product_targets() -> list[tuple[int, str, str]]:
    targets = []
    seen_paths = set()
    position = 0

    for category_path in get_category_paths():
        category_slug = category_path.rsplit("/", 1)[-1].replace(".html", "")
        for product_path in get_product_paths(category_path):
            if product_path in seen_paths:
                continue
            seen_paths.add(product_path)
            position += 1
            targets.append((position, category_slug, product_path))

    return targets


def build_component(item_slug: str, raw_component: dict, fallback_name: str, fallback_index: int) -> dict | None:
    name = first_string(
        raw_component.get("product_marketing_name"),
        raw_component.get("product_name"),
        raw_component.get("imported_product_name"),
        raw_component.get("name"),
        fallback_name,
    )
    ingredient_statement = first_string(
        raw_component.get("ingredient_statement"),
        raw_component.get("product_additional_text_ingredient_statement"),
    )

    if not name or not ingredient_statement:
        return None

    return {
        "id": f"{item_slug}-{slugify(name)}-{fallback_index}",
        "name": name,
        "ingredient_statement": ingredient_statement,
        "sort_order": int(raw_component.get("display_order") or fallback_index),
        "contains": normalize_allergens(raw_component.get("product_allergen")),
        "may_contain": normalize_allergens(raw_component.get("product_additional_allergen")),
    }


def build_item(target: tuple[int, str, str]) -> dict | None:
    sort_order, category_slug, product_path = target
    item_slug = product_path.rsplit("/", 1)[-1].replace(".html", "")
    try:
        details = get_item_details(product_path)
    except urllib.error.HTTPError as error:
        if error.code == 404:
            print(f"Skipping missing product page: {product_path}", file=sys.stderr)
            return None
        raise

    components_root = details.get("components", {})
    raw_components = ensure_list(components_root.get("component") if isinstance(components_root, dict) else components_root)

    components = []
    used_ids = set()
    for index, raw_component in enumerate(raw_components, start=1):
        component = build_component(item_slug, raw_component, f"Component {index}", index)
        if not component:
            continue
        component_id = component["id"]
        suffix = 2
        while component_id in used_ids:
            component_id = f"{component['id']}-{suffix}"
            suffix += 1
        component["id"] = component_id
        used_ids.add(component_id)
        components.append(component)

    if not components:
        fallback_statement = first_string(
            details.get("item_ingredient_statement"),
            details.get("item_additional_text_ingredient_statement"),
        )
        if fallback_statement:
            components.append(
                {
                    "id": f"{item_slug}-item-1",
                    "name": "Item Ingredients",
                    "ingredient_statement": fallback_statement,
                    "sort_order": 1,
                    "contains": normalize_allergens(details.get("item_allergen")),
                    "may_contain": normalize_allergens(details.get("item_additional_allergen")),
                }
            )

    return {
        "id": item_slug,
        "name": first_string(details.get("item_marketing_name"), details.get("item_name"), item_slug),
        "description": first_string(details.get("description"), details.get("item_meta_description"), details.get("item_name")),
        "category": normalize_text(CATEGORY_LABELS.get(category_slug, category_slug.replace("-", " ").title())),
        "sort_order": sort_order,
        "components": sorted(components, key=lambda component: (component["sort_order"], component["name"].lower())),
    }


def collect_menu_items() -> list[dict]:
    targets = collect_product_targets()
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        items = [item for item in executor.map(build_item, targets) if item]
    return sorted(items, key=lambda item: (item["sort_order"], item["name"].lower()))


def build_seed_sql(items: list[dict]) -> str:
    observed_allergens = set(EXTRA_SELECTOR_ALLERGENS)
    menu_rows = []
    component_rows = []
    component_allergen_rows = []
    restaurant_row = "  ({id}, {slug}, {name}, {description}, {cuisine_hint}, 1);".format(
        id=sql_quote("mcdonalds-canada"),
        slug=sql_quote("mcdonalds-canada"),
        name=sql_quote("McDonald's Canada"),
        description=sql_quote("Live McDonald's Canada menu data sourced from current product pages and ingredient details."),
        cuisine_hint=sql_quote("Burgers, breakfast, chicken, beverages, desserts, and more"),
    )

    for item in items:
        menu_rows.append(
            "  ({id}, 'mcdonalds-canada', {name}, {category}, {description}, {sort_order})".format(
                id=sql_quote(item["id"]),
                name=sql_quote(item["name"]),
                category=sql_quote(item["category"]),
                description=sql_quote(item["description"]),
                sort_order=item["sort_order"],
            )
        )

        for component in item["components"]:
            component_rows.append(
                "  ({id}, {menu_item_id}, {name}, {ingredient_statement}, {sort_order})".format(
                    id=sql_quote(component["id"]),
                    menu_item_id=sql_quote(item["id"]),
                    name=sql_quote(component["name"]),
                    ingredient_statement=sql_quote(component["ingredient_statement"]),
                    sort_order=component["sort_order"],
                )
            )

            for allergen in component["contains"]:
                observed_allergens.add(allergen)
                component_allergen_rows.append(
                    f"  ({sql_quote(component['id'])}, {sql_quote(slugify(allergen))}, 'contains')"
                )

            for allergen in component["may_contain"]:
                observed_allergens.add(allergen)
                component_allergen_rows.append(
                    f"  ({sql_quote(component['id'])}, {sql_quote(slugify(allergen))}, 'may_contain')"
                )

    allergen_rows = [
        f"  ({sql_quote(slugify(allergen))}, {sql_quote(allergen)})"
        for allergen in sorted(observed_allergens)
    ]

    lines = [
        "-- Generated from McDonald's Canada menu and item detail pages.",
        f"-- Source: {FULL_MENU_URL}",
        f"-- Menu items: {len(items)}",
        f"-- Components: {len(component_rows)}",
        "truncate table item_component_allergens, item_components, ingredient_allergens, menu_item_ingredients, menu_items, ingredients, allergens, restaurants restart identity cascade;",
        "",
        "insert into restaurants (id, slug, name, description, cuisine_hint, sort_order) values",
        restaurant_row,
        "",
        "insert into allergens (id, name) values",
        ",\n".join(allergen_rows),
        ";",
        "",
        "insert into menu_items (id, restaurant_id, name, category, description, sort_order) values",
        ",\n".join(menu_rows),
        ";",
        "",
        "insert into item_components (id, menu_item_id, name, ingredient_statement, sort_order) values",
        ",\n".join(component_rows),
        ";",
        "",
        "insert into item_component_allergens (item_component_id, allergen_id, relation_type) values",
        ",\n".join(component_allergen_rows),
        ";",
        "",
    ]
    sql = "\n".join(lines)
    validate_sql_output(sql)
    return sql


def main() -> None:
    items = collect_menu_items()
    OUTPUT_PATH.write_text(build_seed_sql(items), encoding="utf-8")
    print(f"Wrote {len(items)} menu items to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
