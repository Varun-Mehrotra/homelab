create table if not exists restaurants (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text,
  cuisine_hint text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists allergens (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists ingredients (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists menu_items (
  id text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  name text not null,
  category text not null,
  description text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists menu_item_ingredients (
  menu_item_id text not null references menu_items(id) on delete cascade,
  ingredient_id text not null references ingredients(id) on delete cascade,
  primary key (menu_item_id, ingredient_id)
);

create table if not exists ingredient_allergens (
  ingredient_id text not null references ingredients(id) on delete cascade,
  allergen_id text not null references allergens(id) on delete cascade,
  primary key (ingredient_id, allergen_id)
);

create index if not exists idx_restaurants_sort_order on restaurants(sort_order);
create index if not exists idx_menu_items_restaurant_id on menu_items(restaurant_id);
create index if not exists idx_menu_items_sort_order on menu_items(sort_order);
create index if not exists idx_menu_item_ingredients_menu_item on menu_item_ingredients(menu_item_id);
create index if not exists idx_ingredient_allergens_ingredient on ingredient_allergens(ingredient_id);

alter table restaurants enable row level security;
alter table allergens enable row level security;
alter table ingredients enable row level security;
alter table menu_items enable row level security;
alter table menu_item_ingredients enable row level security;
alter table ingredient_allergens enable row level security;

drop policy if exists "public read restaurants" on restaurants;
drop policy if exists "public read allergens" on allergens;
drop policy if exists "public read ingredients" on ingredients;
drop policy if exists "public read menu items" on menu_items;
drop policy if exists "public read menu item ingredients" on menu_item_ingredients;
drop policy if exists "public read ingredient allergens" on ingredient_allergens;

create policy "public read restaurants" on restaurants for select using (true);
create policy "public read allergens" on allergens for select using (true);
create policy "public read ingredients" on ingredients for select using (true);
create policy "public read menu items" on menu_items for select using (true);
create policy "public read menu item ingredients" on menu_item_ingredients for select using (true);
create policy "public read ingredient allergens" on ingredient_allergens for select using (true);
