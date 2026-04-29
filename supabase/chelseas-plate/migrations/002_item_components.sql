create table if not exists item_components (
  id text primary key,
  menu_item_id text not null references menu_items(id) on delete cascade,
  name text not null,
  ingredient_statement text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists item_component_allergens (
  item_component_id text not null references item_components(id) on delete cascade,
  allergen_id text not null references allergens(id) on delete cascade,
  relation_type text not null check (relation_type in ('contains', 'may_contain')),
  primary key (item_component_id, allergen_id, relation_type)
);

create index if not exists idx_item_components_menu_item_id on item_components(menu_item_id);
create index if not exists idx_item_components_sort_order on item_components(sort_order);
create index if not exists idx_item_component_allergens_component on item_component_allergens(item_component_id);

alter table item_components enable row level security;
alter table item_component_allergens enable row level security;

drop policy if exists "public read item components" on item_components;
drop policy if exists "public read item component allergens" on item_component_allergens;

create policy "public read item components" on item_components for select using (true);
create policy "public read item component allergens" on item_component_allergens for select using (true);
