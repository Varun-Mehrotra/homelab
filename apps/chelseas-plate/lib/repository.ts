import { type MenuItem, type Restaurant } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase";

type AllergenRecord = {
  allergen:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

type RawIngredient = {
  id: string;
  name: string;
  ingredient_allergens: AllergenRecord[];
};

type IngredientRecord = {
  ingredient: RawIngredient | RawIngredient[] | null;
};

type MenuItemRow = {
  id: string;
  restaurant_id: string;
  name: string;
  category: string;
  description: string;
  menu_item_ingredients: IngredientRecord[];
};

type RestaurantRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cuisine_hint: string;
};

type AllergenRow = {
  name: string;
};

function firstOf<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getIngredient(entry: IngredientRecord) {
  return firstOf(entry.ingredient);
}

function getAllergenName(record: AllergenRecord) {
  return firstOf(record.allergen)?.name ?? null;
}

export function deriveIngredients(menuItem: MenuItemRow) {
  return menuItem.menu_item_ingredients
    .flatMap((entry) => {
      const ingredient = getIngredient(entry);

      return ingredient ? [ingredient.name] : [];
    })
    .sort((left, right) => left.localeCompare(right));
}

export function deriveAllergens(menuItem: MenuItemRow) {
  return Array.from(
    new Set(
      menuItem.menu_item_ingredients.flatMap((entry) => {
        const ingredient = getIngredient(entry);

        return ingredient?.ingredient_allergens.flatMap((allergenLink) => {
          const allergenName = getAllergenName(allergenLink);

          return allergenName ? [allergenName] : [];
        }) ?? [];
      }),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

export function mapRestaurant(row: RestaurantRow): Restaurant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    cuisineHint: row.cuisine_hint,
  };
}

export function mapMenuItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    name: row.name,
    category: row.category,
    description: row.description,
    ingredients: deriveIngredients(row),
    allergens: deriveAllergens(row),
  };
}

export async function getRestaurants() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, description, cuisine_hint")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load restaurants: ${error.message}`);
  }

  return (data satisfies RestaurantRow[]).map(mapRestaurant);
}

export async function getAllergens() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("allergens").select("name").order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load allergens: ${error.message}`);
  }

  return (data satisfies AllergenRow[]).map((row) => row.name);
}

export async function getRestaurantBySlug(slug: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, description, cuisine_hint")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load restaurant ${slug}: ${error.message}`);
  }

  return data ? mapRestaurant(data satisfies RestaurantRow) : undefined;
}

export async function getMenuItemsForRestaurant(restaurantId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select(
      `
        id,
        restaurant_id,
        name,
        category,
        description,
        menu_item_ingredients (
          ingredient:ingredients (
            id,
            name,
            ingredient_allergens (
              allergen:allergens (
                name
              )
            )
          )
        )
      `,
    )
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load menu items for restaurant ${restaurantId}: ${error.message}`);
  }

  return (data as MenuItemRow[]).map(mapMenuItem);
}
