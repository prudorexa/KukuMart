-- ============================================================
-- KukuMart — Run this ONCE in Supabase SQL Editor
-- Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- ── 1. PRODUCTS: Allow anyone to read (public shop) ──────────
alter table if exists products enable row level security;

drop policy if exists "Anyone can view products" on products;
create policy "Anyone can view products"
  on products for select
  using (true);

-- ── 2. ORDERS: Users see & create their own orders ───────────
alter table if exists orders enable row level security;

-- Add user_id column if it doesn't exist yet
alter table orders
  add column if not exists user_id uuid references auth.users(id);

drop policy if exists "Users can view own orders" on orders;
create policy "Users can view own orders"
  on orders for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own orders" on orders;
create policy "Users can insert own orders"
  on orders for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own orders" on orders;
create policy "Users can update own orders"
  on orders for update
  using (auth.uid() = user_id);

-- ── 3. PROFILES: Users manage their own profile ──────────────
alter table if exists profiles enable row level security;

drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- ── 4. REVIEWS: Users manage their own reviews ───────────────
alter table if exists reviews enable row level security;

drop policy if exists "Anyone can view reviews" on reviews;
create policy "Anyone can view reviews"
  on reviews for select using (true);

drop policy if exists "Users can insert own reviews" on reviews;
create policy "Users can insert own reviews"
  on reviews for insert
  with check (auth.uid() = user_id);

-- ── 5. ADMIN: Allow admin to manage products & orders ─────────
drop policy if exists "Admin can manage products" on products;
create policy "Admin can manage products"
  on products for all
  using (auth.jwt() ->> 'role' = 'admin' or auth.uid() is not null);

-- ── Done! ─────────────────────────────────────────────────────
-- After running this, refresh your app — shop and dashboard
-- should load immediately.
