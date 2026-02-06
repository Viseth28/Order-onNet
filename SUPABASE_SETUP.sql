-- 1. Create table for menu items
create table if not exists public.menu_items (
  id text primary key,
  name text not null,
  description text,
  price numeric not null,
  category text,
  image text,
  available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create table for settings
create table if not exists public.settings (
  id integer primary key,
  restaurant_name text,
  telegram_bot_token text,
  telegram_chat_id text,
  currency text default '$'
);

-- 3. NEW: Create table for categories
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  sort_order serial,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table public.menu_items enable row level security;
alter table public.settings enable row level security;
alter table public.categories enable row level security;

-- 5. Create Policies

-- Menu Items Policies
drop policy if exists "Enable read access for all users" on public.menu_items;
create policy "Enable read access for all users" on public.menu_items for select using (true);

drop policy if exists "Enable insert for all users" on public.menu_items;
create policy "Enable insert for all users" on public.menu_items for insert with check (true);

drop policy if exists "Enable update for all users" on public.menu_items;
create policy "Enable update for all users" on public.menu_items for update using (true) with check (true);

drop policy if exists "Enable delete for all users" on public.menu_items;
create policy "Enable delete for all users" on public.menu_items for delete using (true);

-- Settings Policies
drop policy if exists "Enable read access for all users" on public.settings;
create policy "Enable read access for all users" on public.settings for select using (true);

drop policy if exists "Enable insert for all users" on public.settings;
create policy "Enable insert for all users" on public.settings for insert with check (true);

drop policy if exists "Enable update for all users" on public.settings;
create policy "Enable update for all users" on public.settings for update using (true) with check (true);

-- Categories Policies
drop policy if exists "Enable read access for all users" on public.categories;
create policy "Enable read access for all users" on public.categories for select using (true);

drop policy if exists "Enable all access for all users" on public.categories;
create policy "Enable all access for all users" on public.categories for all using (true) with check (true);

-- 6. Seed initial data

-- Default Settings
insert into public.settings (id, restaurant_name, currency)
values (1, 'SwiftServe Bistro', '$')
on conflict (id) do nothing;

-- Populate Categories from existing Menu Items (Migration)
insert into public.categories (name)
select distinct category from public.menu_items
where category is not null
on conflict (name) do nothing;
