-- ============================================================
-- KukuMart — order emails, tracking links and service ratings
-- Run ONCE in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run again (everything is "if not exists" / "or replace").
-- RUN THIS BEFORE deploying the new code.
-- ============================================================

-- ── 1. ORDERS: customer email + "which status did we last email" ─────────
alter table orders
  add column if not exists email text,
  add column if not exists last_emailed_status text;

-- ── 2. REVIEWS: one rating per order ─────────────────────────────────────
create table if not exists reviews (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid references orders(id) on delete cascade,
  user_id    uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Add every column we need (works whether the table is new or already existed)
alter table reviews
  add column if not exists customer_name  text,
  add column if not exists area           text,
  add column if not exists rating         smallint,
  add column if not exists quality_rating  smallint,
  add column if not exists delivery_rating smallint,
  add column if not exists service_rating  smallint,
  add column if not exists comment        text;

create unique index if not exists reviews_order_id_key on reviews(order_id);

alter table reviews enable row level security;

drop policy if exists "Anyone can view reviews" on reviews;
create policy "Anyone can view reviews"
  on reviews for select using (true);

-- ── 3. TRACK AN ORDER BY ITS ID (works for the link in the email) ───────
-- The order's UUID is the secret. Returns only what the tracking page needs
-- (no email, no GPS coordinates, no user id).
create or replace function track_order(p_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select to_jsonb(o)
           - 'email' - 'lat' - 'lng' - 'user_id' - 'last_emailed_status'
         || jsonb_build_object(
              'reviewed', exists (select 1 from reviews r where r.order_id = o.id)
            )
  from orders o
  where o.id = p_id;
$$;

-- ── 4. SUBMIT A RATING (only for delivered orders, once per order) ──────
create or replace function submit_review(
  p_order_id uuid,
  p_rating   int,
  p_quality  int default null,
  p_delivery int default null,
  p_service  int default null,
  p_comment  text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o orders%rowtype;
begin
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'invalid_rating';
  end if;
  if p_quality  is not null and p_quality  not between 1 and 5 then raise exception 'invalid_rating'; end if;
  if p_delivery is not null and p_delivery not between 1 and 5 then raise exception 'invalid_rating'; end if;
  if p_service  is not null and p_service  not between 1 and 5 then raise exception 'invalid_rating'; end if;

  select * into o from orders where id = p_order_id;
  if not found then raise exception 'order_not_found'; end if;
  if o.status <> 'delivered' then raise exception 'order_not_delivered'; end if;
  if exists (select 1 from reviews where order_id = p_order_id) then
    raise exception 'already_reviewed';
  end if;

  insert into reviews (
    order_id, user_id, customer_name, area,
    rating, quality_rating, delivery_rating, service_rating, comment
  ) values (
    o.id, o.user_id,
    nullif(split_part(trim(coalesce(o.customer_name, '')), ' ', 1), ''),   -- first name only (public)
    case when o.delivery_zone = 'To be confirmed' then null else o.delivery_zone end,
    p_rating, p_quality, p_delivery, p_service,
    nullif(left(trim(coalesce(p_comment, '')), 1000), '')
  );
end;
$$;

grant execute on function track_order(uuid)  to anon, authenticated;
grant execute on function submit_review(uuid, int, int, int, int, text) to anon, authenticated;
