# Chelsea's Plate App Notes

This file documents the current data-model rules for `apps/chelseas-plate` so future updates to Supabase data stay consistent with the app behavior.

## Scope

- App path: `/Users/varun/projects/homelab/apps/chelseas-plate`
- Related Supabase files:
  - `/Users/varun/projects/homelab/supabase/chelseas-plate/migrations/001_schema.sql`
  - `/Users/varun/projects/homelab/supabase/chelseas-plate/migrations/002_item_components.sql`
  - `/Users/varun/projects/homelab/supabase/chelseas-plate/seed.sql`
- Main app mapping code:
  - `/Users/varun/projects/homelab/apps/chelseas-plate/lib/data.ts`
  - `/Users/varun/projects/homelab/apps/chelseas-plate/lib/repository.ts`
  - `/Users/varun/projects/homelab/apps/chelseas-plate/lib/allergen-aliases.ts`

## Effective Data Model

The app currently treats `item_components` as the source of truth for item composition and allergen display.

### Restaurant

Database fields used by the app:
- `restaurants.id`
- `restaurants.slug`
- `restaurants.name`
- `restaurants.description`
- `restaurants.cuisine_hint`
- `restaurants.sort_order`

App type:
- `Restaurant`
  - `id`
  - `name`
  - `slug`
  - `description`
  - `cuisineHint`

Criteria:
- `slug` must be stable and URL-safe because routes depend on it.
- `sort_order` controls display order in the restaurant directory.
- `description` should describe the data coverage honestly. Do not imply full-menu coverage if the dataset is partial.

### Menu Item

Database fields used by the app:
- `menu_items.id`
- `menu_items.restaurant_id`
- `menu_items.name`
- `menu_items.category`
- `menu_items.description`
- `menu_items.sort_order`

App type:
- `MenuItem`
  - `id`
  - `restaurantId`
  - `name`
  - `category`
  - `description`
  - `components`
  - `allergens`

Criteria:
- `restaurant_id` must reference a valid restaurant.
- `name` should match the public menu item name shown to users.
- `category` is used in UI and search, so keep it short and human-readable.
- `description` is what the free-text search matches against along with `name` and `category`.
- `sort_order` controls item order within a restaurant.

### Item Component

Database fields used by the app:
- `item_components.id`
- `item_components.menu_item_id`
- `item_components.name`
- `item_components.ingredient_statement`
- `item_components.sort_order`

App type:
- `MenuItemComponent`
  - `id`
  - `name`
  - `ingredients`
  - `containsAllergens`
  - `mayContainAllergens`

Criteria:
- One component should represent one supplier/menu sub-part such as `Regular Bun`, `Beef Patty`, `Mustard`, or `Mayonnaise-Style Sauce`.
- `ingredient_statement` should be the full ingredient text for that component, not a shortened ingredient label.
- `sort_order` must preserve the order the restaurant presents components, or the closest practical equivalent.
- Components should be split at the same level the restaurant exposes ingredient statements. Do not combine unrelated sub-parts into one blob if the source provides them separately.

### Item Component Allergens

Database fields used by the app:
- `item_component_allergens.item_component_id`
- `item_component_allergens.allergen_id`
- `item_component_allergens.relation_type`

Supported relation types:
- `contains`
- `may_contain`

Criteria:
- Use `contains` when the source explicitly says `Contains: ...` or the allergen is clearly part of the component ingredients.
- Use `may_contain` when the source explicitly says `May contain: ...`.
- `may_contain` still contributes to item-level filtering. This is intentional and conservative.

## Current Allergen Behavior

Item-level allergen filtering is derived from the union of all component allergens.

Source layers:
1. Explicit database links in `item_component_allergens`
2. Alias-derived sensitivities from raw ingredient text in `ingredient_statement`

Current alias-derived sensitivities in `/Users/varun/projects/homelab/apps/chelseas-plate/lib/allergen-aliases.ts`:
- `onion`
  - matches `onion`, `onions`, `onion powder`
- `garlic`
  - matches `garlic`, `garlic powder`
- `msg`
  - matches `msg`, `monosodium glutamate`

Criteria:
- If a component ingredient statement contains one of these aliases, the app will flag the canonical selector value even without an explicit database link.
- When adding new sensitivity aliases, update `lib/allergen-aliases.ts` and verify selector behavior in the app.
- Do not create separate selector values for `onion powder`, `garlic powder`, or `monosodium glutamate`. They should resolve to `onion`, `garlic`, and `msg`.

## Important Schema Note

`001_schema.sql` still contains legacy normalized tables:
- `ingredients`
- `menu_item_ingredients`
- `ingredient_allergens`

The current app repository does not read from those tables. The live app path uses:
- `restaurants`
- `allergens`
- `menu_items`
- `item_components`
- `item_component_allergens`

Implication:
- For now, when adding new data, prioritize the component-based model because that is what the app renders and filters against.
- Do not assume that populating `ingredients` or `menu_item_ingredients` will affect the UI. It will not unless the repository layer is changed.

## Rules For Adding New Items

When adding a new item to Supabase:

1. Add or confirm the parent restaurant row exists.
2. Add the `menu_items` row with accurate `name`, `category`, `description`, and `sort_order`.
3. Add one `item_components` row per real menu sub-part.
4. Paste the full ingredient statement for each component.
5. Add `item_component_allergens` rows for explicit `contains` and `may_contain` declarations.
6. Check whether the raw text includes alias-based sensitivities like onion, garlic, or MSG.
7. Verify the item renders with:
   - correct component order
   - correct `Contains` rows
   - correct `May contain` rows
   - expected item-level safe/skip behavior

Criteria for good data entry:
- Prefer exact source wording over paraphrase for ingredient statements.
- Keep capitalization and punctuation reasonably close to the source unless normalization is necessary.
- Do not silently invent allergens that are not supported by the source or alias rules.
- If source data is ambiguous, keep the raw ingredient statement exact and add only the allergen links you can defend.

## Rules For Adding New Restaurants

When adding a new restaurant:

1. Insert the restaurant in `restaurants`.
2. Choose a stable slug because routes depend on it.
3. Set `sort_order` intentionally so directory ordering stays predictable.
4. Add a truthful description of menu coverage.
5. Add a small item set first, then expand incrementally.

Recommendation:
- Add items in small batches and verify each batch in the UI before adding many more. This app is currently set up for careful manual curation, not bulk ingestion.

## Search And UI Notes

- Search matches only:
  - `menu_items.name`
  - `menu_items.category`
  - `menu_items.description`
- Search does not currently match component names or ingredient statements.
- The right-side components panel is collapsed by default and expands per item.
- `Safe foods` and `Skip foods` navigation should appear whenever any allergen or sensitivity is selected, even if zero visible items are flagged.

Implication:
- A good item description matters because users rely on it for discovery.
- If users need ingredient-text search later, that requires an app change, not just more data.

## Verification Checklist

After changing Supabase data or seed content:

1. Reapply the seed or SQL updates to Supabase.
2. Run:
   - `npm test`
   - `npm run build`
3. Manually verify at least one item in the browser for:
   - component list
   - ingredient statements
   - explicit contains/may-contain display
   - safe/skip filtering
4. If you changed allergen alias logic, verify the selector includes the expected canonical values.

## Current Seed State

At the time of writing, the seed is generated from the current McDonald's Canada public menu and item detail pages:
- one restaurant: `McDonald's Canada`
- current generated menu size: `166` items
- current generated component size: `622` components

Operational notes:
- the generator currently skips a few broken product links if McDonald's leaves dead links in category pages
- the live site can rate-limit repeated full scrapes, so the checked-in `seed.sql` is the source of truth after a successful generation run
