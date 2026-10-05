-- Run once in Supabase -> SQL Editor.
-- Adds profile columns and auto-creates a profile row on every new sign-up.

-- Add missing columns to profiles table
alter table profiles
  add column if not exists default_area       text,
  add column if not exists notif_order_updates  boolean default true,
  add column if not exists notif_loyalty_alerts boolean default true,
  add column if not exists notif_promotions    boolean default false,
  add column if not exists updated_at          timestamptz default now();

-- Auto-create profile when a new user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, loyalty_points, loyalty_tier, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    0,
    'bronze',
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Attach trigger (runs after every new signup)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Add user_id column to orders if not exists
alter table orders
  add column if not exists user_id uuid references auth.users(id);