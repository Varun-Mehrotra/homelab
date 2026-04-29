import { type MenuItem, type MenuItemComponent, type Restaurant } from "@/lib/data";
import { deriveAliasAllergensFromText, getExtraAllergens, mergeAllergens } from "@/lib/allergen-aliases";
import { getSupabaseServerClient } from "@/lib/supabase";

type AllergenRecord = {
  relation_type: "contains" | "may_contain";
  allergen:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

type RawComponent = {
  id: string;
  name: string;
  ingredient_statement: string;
  sort_order: number;
  item_component_allergens: AllergenRecord[];
};

type MenuItemRow = {
  id: string;
  restaurant_id: string;
  name: string;
  category: string;
  description: string;
  item_components: (RawComponent | RawComponent[] | null)[];
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

function getComponent(entry: RawComponent | RawComponent[] | null) {
  return firstOf(entry);
}

function getAllergenName(record: AllergenRecord) {
  return firstOf(record.allergen)?.name ?? null;
}

export function deriveComponents(menuItem: MenuItemRow): MenuItemComponent[] {
  return menuItem.item_components
    .flatMap((entry) => {
      const component = getComponent(entry);
      if (!component) {
        return [];
      }

      const linkedContainsAllergens = component.item_component_allergens
        .filter((allergenLink) => allergenLink.relation_type === "contains")
        .flatMap((allergenLink) => {
          const allergenName = getAllergenName(allergenLink);
          return allergenName ? [allergenName] : [];
        });

      const mayContainAllergens = component.item_component_allergens
        .filter((allergenLink) => allergenLink.relation_type === "may_contain")
        .flatMap((allergenLink) => {
          const allergenName = getAllergenName(allergenLink);
          return allergenName ? [allergenName] : [];
        })
        .sort((left, right) => left.localeCompare(right));

      const derivedContainsAllergens = deriveAliasAllergensFromText(component.ingredient_statement);
      const containsAllergens = mergeAllergens(linkedContainsAllergens, derivedContainsAllergens);

      return [
        {
          id: component.id,
          name: component.name,
          ingredients: component.ingredient_statement,
          containsAllergens,
          mayContainAllergens,
          sortOrder: component.sort_order,
        },
      ];
    })
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(({ sortOrder: _sortOrder, ...component }) => component);
}

export function deriveAllergens(menuItem: MenuItemRow) {
  return mergeAllergens(
    ...deriveComponents(menuItem).map((component) => [...component.containsAllergens, ...component.mayContainAllergens]),
  );
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
    components: deriveComponents(row),
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

  return mergeAllergens(
    (data satisfies AllergenRow[]).map((row) => row.name),
    getExtraAllergens(),
  );
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
        item_components (
            id,
            name,
            ingredient_statement,
            sort_order,
            item_component_allergens (
              relation_type,
              allergen:allergens (
                name
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
