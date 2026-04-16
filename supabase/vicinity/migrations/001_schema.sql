create table if not exists events (
  id uuid primary key,
  title text not null,
  description text not null,
  start_time timestamptz not null,
  venue_name text not null,
  address_text text not null default '',
  latitude double precision not null,
  longitude double precision not null,
  contact_info text,
  booking_url text,
  price_text text not null,
  category text not null,
  city_region text not null,
  created_at timestamptz not null default now(),
  constraint events_contact_or_booking check (
    coalesce(nullif(trim(contact_info), ''), nullif(trim(booking_url), '')) is not null
  ),
  constraint events_latitude_range check (latitude between 43.0 and 44.2),
  constraint events_longitude_range check (longitude between -80.2 and -78.8),
  constraint events_category_allowed check (
    category in ('Arts', 'Family', 'Food', 'Markets', 'Music', 'Nightlife', 'Sports', 'Wellness')
  ),
  constraint events_city_region_allowed check (
    city_region in ('Toronto', 'Etobicoke', 'Mississauga', 'North York', 'Scarborough', 'Vaughan')
  )
);

create index if not exists idx_events_start_time on events(start_time);
create index if not exists idx_events_category on events(category);
create index if not exists idx_events_city_region on events(city_region);
create index if not exists idx_events_coordinates on events(latitude, longitude);

alter table events enable row level security;

drop policy if exists "public read upcoming events" on events;
drop policy if exists "public insert events" on events;

create policy "public read upcoming events" on events for select using (true);
create policy "public insert events" on events for insert with check (true);
