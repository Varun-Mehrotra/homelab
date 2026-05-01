alter table menu_items
add column if not exists ingredient_statement text;

create table if not exists menu_item_allergens (
  menu_item_id text not null references menu_items(id) on delete cascade,
  allergen_id text not null references allergens(id) on delete cascade,
  relation_type text not null check (relation_type in ('contains', 'may_contain')),
  primary key (menu_item_id, allergen_id, relation_type)
);

create index if not exists idx_menu_item_allergens_menu_item_id on menu_item_allergens(menu_item_id);

alter table menu_item_allergens enable row level security;

drop policy if exists "public read menu item allergens" on menu_item_allergens;

create policy "public read menu item allergens" on menu_item_allergens for select using (true);
