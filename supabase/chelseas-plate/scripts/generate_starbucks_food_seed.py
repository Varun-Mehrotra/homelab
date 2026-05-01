#!/usr/bin/env python3
"""Append Starbucks Canada food items to Chelsea's Plate seed.sql."""

from __future__ import annotations

import json
import re
import socket
import subprocess
import time
import unicodedata
import urllib.error
import urllib.request
from collections import OrderedDict
from pathlib import Path

BASE_URL = "https://www.starbucks.ca"
MENU_URL = f"{BASE_URL}/apiproxy/v1/ordering/menu"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "seed.sql"
CACHE_DIR = Path(__file__).resolve().parent / ".starbucks-cache"
REPO_ROOT = Path(__file__).resolve().parents[3]
SEED_REPO_PATH = "supabase/chelseas-plate/seed.sql"
MAX_RETRIES = 5
REQUEST_DELAY_SECONDS = 0.6

RESTAURANT_ID = "starbucks-canada"
RESTAURANT_ROW = (
    "  ('starbucks-canada', 'starbucks-canada', 'Starbucks Canada', "
    "'Starbucks Canada food menu data sourced from the current public ordering API for breakfast, bakery, treats, lunch, and lite bites.', "
    "'Breakfast sandwiches, bakery, snacks, and lunch items', 2)"
)

TARGET_CATEGORIES = OrderedDict(
    {
        "/food/breakfast": "Breakfast",
        "/food/bakery": "Bakery",
        "/food/treats": "Treats",
        "/food/lunch": "Lunch",
        "/food/lite-bites": "Lite Bites",
    }
)

STARBUCKS_ALLERGEN_MAP = {
    "Barley": "barley",
    "Egg": "egg",
    "Fish": "fish",
    "Gluten": "gluten",
    "Milk": "milk",
    "Mustard": "mustard",
    "Oat": "oat",
    "Oats": "oat",
    "Peanut": "peanuts",
    "Peanuts": "peanuts",
    "Rye": "rye",
    "Sesame": "sesame-seeds",
    "Sesame Seeds": "sesame-seeds",
    "Soy": "soy",
    "Sulphites": "sulphites",
    "Tree Nut": "tree-nuts",
    "Tree Nuts": "tree-nuts",
    "Wheat": "wheat",
}

STARBUCKS_EXTRA_ALLERGENS = OrderedDict(
    {
        "gluten": "gluten",
        "peanuts": "peanuts",
    }
)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
    ),
    "accept": "application/json, text/plain, */*",
    "Accept-Language": "en-CA,en;q=0.9",
    "X-Requested-With": "XMLHttpRequest",
    "origin": "https://www.starbucks.ca",
    "referer": "https://www.starbucks.ca/menu/food",
}


def fetch_json(url: str) -> dict:
    CACHE_DIR.mkdir(exist_ok=True)
    cache_key = slugify(re.sub(r"^https?://", "", url))
    cache_path = CACHE_DIR / f"{cache_key}.json"
    if cache_path.exists():
        return json.loads(cache_path.read_text())

    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        request = urllib.request.Request(url, headers=HEADERS)
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                payload = json.load(response)
            cache_path.write_text(json.dumps(payload))
            time.sleep(REQUEST_DELAY_SECONDS)
            return payload
        except urllib.error.HTTPError as error:
            last_error = error
            if error.code in {403, 429} and attempt < MAX_RETRIES:
                time.sleep(attempt * 3)
                continue
            raise
        except (TimeoutError, socket.timeout, urllib.error.URLError) as error:
            last_error = error
            if attempt < MAX_RETRIES:
                time.sleep(attempt * 3)
                continue
            raise

    raise RuntimeError(f"Failed to fetch {url}: {last_error}")


def normalize_text(value: str) -> str:
    if not value:
        return ""

    normalized = (
        value.replace("\u00a0", " ")
        .replace("\u2019", "'")
        .replace("\u2018", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2013", "-")
        .replace("\u2014", "-")
        .replace("\u2022", "-")
        .replace("\u2026", "...")
        .replace("\u2122", "")
        .replace("\u00ae", "")
    )
    normalized = unicodedata.normalize("NFKD", normalized).encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"[ \t]+", " ", normalized)
    normalized = re.sub(r" *\n+ *", "\n", normalized)
    return normalized.strip()


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def slugify(value: str) -> str:
    text = normalize_text(value).lower().replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "item"


def clean_description(value: str) -> str:
    text = normalize_text(value)
    text = text.replace("\n-", " - ")
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def flatten_ingredient_node(node: dict | str | None) -> str:
    if node is None:
        return ""
    if isinstance(node, str):
        return normalize_text(node)
    if not isinstance(node, dict):
        return ""

    name = normalize_text(node.get("name", ""))
    children = [flatten_ingredient_node(child) for child in node.get("children", [])]
    children = [child for child in children if child]

    if children and name:
        return f"{name} ({', '.join(children)})"
    if children:
        return ", ".join(children)
    return name


def component_statement(component: dict | str | None) -> tuple[str, str]:
    if isinstance(component, dict):
        name = normalize_text(component.get("name", "")) or "Component"
        children = [flatten_ingredient_node(child) for child in component.get("children", [])]
        children = [child for child in children if child]
        statement = ", ".join(children) if children else name
        return name, statement

    text = flatten_ingredient_node(component)
    if text:
        return "Ingredient", text
    return "Ingredient", "Source ingredients unavailable from the current public ordering API."


def ingredient_statement_from_list(ingredient_components: list[dict | str]) -> str:
    statements = [flatten_ingredient_node(component) for component in ingredient_components]
    statements = [statement for statement in statements if statement]
    return ", ".join(statements)


def should_use_component_mode(ingredient_components: list[dict | str]) -> bool:
    if not ingredient_components:
        return False

    child_count = sum(
        1
        for component in ingredient_components
        if isinstance(component, dict) and component.get("children")
    )

    # Starbucks mixes true item parts with flat ingredient lists.
    # Treat large top-level ingredient arrays as direct ingredients rather than fake components.
    return len(ingredient_components) <= 8 and child_count >= 2


def fetch_food_products() -> list[dict]:
    menu_payload = fetch_json(MENU_URL)
    food_menu = next(menu for menu in menu_payload["menus"] if menu["name"] == "Food")

    products = []
    seen = set()

    def walk(node: dict, root_category: str | None = None) -> None:
        category = TARGET_CATEGORIES.get(node.get("uri"), root_category)

        if category:
            for product in node.get("products", []):
                key = (product["productNumber"], product["formCode"].lower())
                if key in seen:
                    continue
                seen.add(key)
                products.append(
                    {
                        "category": category,
                        "name": normalize_text(product["name"]),
                        "product_number": product["productNumber"],
                        "form_code": product["formCode"].lower(),
                        "uri": product.get("uri", ""),
                    }
                )

        for child in node.get("children", []):
            walk(child, category)

    walk(food_menu)
    return products


def parse_allergens(text: str) -> list[tuple[str, str]]:
    parsed = []
    for token in [part.strip() for part in text.split(",") if part.strip()]:
        if token in {"N/A", "None"}:
            continue
        mapped = STARBUCKS_ALLERGEN_MAP.get(token)
        if not mapped:
            normalized = re.sub(r"[^a-z]", "", token.lower())
            normalized_map = {
                re.sub(r"[^a-z]", "", source.lower()): target
                for source, target in STARBUCKS_ALLERGEN_MAP.items()
            }
            mapped = normalized_map.get(normalized)
        if not mapped and normalized in {
            "almond",
            "almonds",
            "brazilnut",
            "brazilnuts",
            "cashew",
            "cashews",
            "hazelnut",
            "hazelnuts",
            "macadamia",
            "macadamianuts",
            "pecan",
            "pecans",
            "pistachio",
            "pistachios",
            "walnut",
            "walnuts",
        }:
            mapped = "tree-nuts"
        if not mapped:
            raise RuntimeError(f"Unhandled Starbucks allergen token: {token}")
        parsed.append((token, mapped))
    return parsed


def render_row(values: list[str]) -> str:
    return f"  ({', '.join(values)})"


def load_base_seed() -> str:
    try:
        return subprocess.check_output(["git", "show", f"HEAD:{SEED_REPO_PATH}"], cwd=REPO_ROOT).decode()
    except Exception:
        return OUTPUT_PATH.read_text()


def count_rows(text: str, marker: str, next_marker: str | None) -> int:
    if next_marker:
        pattern = rf"{re.escape(marker)}\n(.*?)\n\n{re.escape(next_marker)}"
    else:
        pattern = rf"{re.escape(marker)}\n(.*)$"
    match = re.search(pattern, text, re.S)
    if not match:
        raise RuntimeError(f"Unable to find section for marker: {marker}")
    return len([line for line in match.group(1).splitlines() if line.strip().startswith("('") or line.strip().startswith("  ('")])


def update_header(text: str, restaurant_count: int, menu_item_count: int, component_count: int) -> str:
    truncate_index = text.index("truncate table ")
    header = (
        "-- Seed data for Chelsea's Plate.\n"
        "-- Sources:\n"
        "--   McDonald's Canada: https://www.mcdonalds.com/ca/en-ca/full-menu.html\n"
        "--   Starbucks Canada food menu: https://www.starbucks.ca/menu/food/*\n"
        f"-- Restaurants: {restaurant_count}\n"
        f"-- Menu items: {menu_item_count}\n"
        f"-- Components: {component_count}\n"
    )
    return header + text[truncate_index:]


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


def main() -> None:
    base_seed = load_base_seed()

    menu_item_rows = []
    menu_item_allergen_rows = []
    component_rows = []
    component_allergen_rows = []

    products = fetch_food_products()

    for sort_order, product in enumerate(products, start=1):
        detail = fetch_json(f"{BASE_URL}/apiproxy/v1/ordering/{product['product_number']}/{product['form_code']}")
        item = detail["products"][0]
        size = item["sizes"][0]

        item_id = f"starbucks-{slugify(item['name'])}-{product['product_number']}"
        description = clean_description(item.get("description", ""))
        ingredient_components = size.get("ingredients") or []
        use_component_mode = should_use_component_mode(ingredient_components)
        ingredient_statement = ingredient_statement_from_list(ingredient_components) if not use_component_mode else ""

        menu_item_rows.append(
            render_row(
                [
                    sql_quote(item_id),
                    sql_quote(RESTAURANT_ID),
                    sql_quote(normalize_text(item["name"])),
                    sql_quote(product["category"]),
                    sql_quote(description),
                    sql_quote(ingredient_statement) if ingredient_statement else "null",
                    str(sort_order),
                ]
            )
        )
        component_sort = 1

        if use_component_mode:
            for component in ingredient_components:
                name, statement = component_statement(component)
                if not statement:
                    continue

                component_id = f"{item_id}-{slugify(name)}-{component_sort}"
                component_rows.append(
                    render_row(
                        [
                            sql_quote(component_id),
                            sql_quote(item_id),
                            sql_quote(name),
                            sql_quote(statement),
                            str(component_sort),
                        ]
                    )
                )
                component_sort += 1

        allergen_text = normalize_text((size.get("allergens") or {}).get("text", ""))
        parsed_allergens = parse_allergens(allergen_text) if allergen_text else []
        deduped_allergens = []
        seen_allergen_ids = set()
        for display, allergen_id in parsed_allergens:
            if allergen_id in seen_allergen_ids:
                continue
            seen_allergen_ids.add(allergen_id)
            deduped_allergens.append((display, allergen_id))
        parsed_allergens = deduped_allergens

        if parsed_allergens:
            if use_component_mode:
                component_id = f"{item_id}-declared-allergen-notice-{component_sort}"
                notice_text = f"Source-declared allergens: {', '.join(display for display, _ in parsed_allergens)}."
                component_rows.append(
                    render_row(
                        [
                            sql_quote(component_id),
                            sql_quote(item_id),
                            sql_quote("Declared allergen notice"),
                            sql_quote(notice_text),
                            str(component_sort),
                        ]
                    )
                )

                for _, allergen_id in parsed_allergens:
                    component_allergen_rows.append(
                        render_row(
                            [
                                sql_quote(component_id),
                                sql_quote(allergen_id),
                                sql_quote("contains"),
                            ]
                        )
                    )
            else:
                for _, allergen_id in parsed_allergens:
                    menu_item_allergen_rows.append(
                        render_row(
                            [
                                sql_quote(item_id),
                                sql_quote(allergen_id),
                                sql_quote("contains"),
                            ]
                        )
                    )

    original_restaurants = count_rows(
        base_seed,
        "insert into restaurants (id, slug, name, description, cuisine_hint, sort_order) values",
        "insert into allergens (id, name) values",
    )
    original_menu_items = count_rows(
        base_seed,
        "insert into menu_items (id, restaurant_id, name, category, description, sort_order) values",
        "insert into item_components (id, menu_item_id, name, ingredient_statement, sort_order) values",
    )
    original_components = count_rows(
        base_seed,
        "insert into item_components (id, menu_item_id, name, ingredient_statement, sort_order) values",
        "insert into item_component_allergens (item_component_id, allergen_id, relation_type) values",
    )

    starbucks_blocks = (
        "\n\n-- Starbucks Canada food additions.\n"
        "insert into restaurants (id, slug, name, description, cuisine_hint, sort_order) values\n"
        f"{RESTAURANT_ROW}\n"
        ";\n\n"
        "insert into allergens (id, name) values\n"
        + ",\n".join(
            render_row([sql_quote(allergen_id), sql_quote(allergen_name)])
            for allergen_id, allergen_name in STARBUCKS_EXTRA_ALLERGENS.items()
        )
        + "\n;\n\n"
        "insert into menu_items (id, restaurant_id, name, category, description, ingredient_statement, sort_order) values\n"
        + ",\n".join(menu_item_rows)
        + "\n;\n\n"
        + (
            "insert into menu_item_allergens (menu_item_id, allergen_id, relation_type) values\n"
            + ",\n".join(menu_item_allergen_rows)
            + "\n;\n\n"
            if menu_item_allergen_rows
            else ""
        )
        + "insert into item_components (id, menu_item_id, name, ingredient_statement, sort_order) values\n"
        + ",\n".join(component_rows)
        + "\n;\n\n"
        + "insert into item_component_allergens (item_component_id, allergen_id, relation_type) values\n"
        + ",\n".join(component_allergen_rows)
        + "\n;\n"
    )

    seed_text = base_seed.rstrip() + starbucks_blocks
    restaurant_count = original_restaurants + 1
    menu_item_count = original_menu_items + len(menu_item_rows)
    component_count = original_components + len(component_rows)
    seed_text = update_header(seed_text, restaurant_count, menu_item_count, component_count)

    validate_sql_output(seed_text)
    OUTPUT_PATH.write_text(seed_text)

    print(f"Added Starbucks Canada food data: {len(menu_item_rows)} items, {len(component_rows)} components.")


if __name__ == "__main__":
    main()
