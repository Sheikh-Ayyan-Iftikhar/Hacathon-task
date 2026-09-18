-- ============================================================
-- LetMeServe — Supabase schema
-- Run this once in the Supabase SQL editor for a fresh project.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. PROFILES  (one row per auth user; role = customer | provider)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('customer', 'provider')),
  phone text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. PROVIDER_PROFILES  (extra info only providers have)
-- ============================================================
create table if not exists public.provider_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  service_category text not null,
  location text not null,
  experience_years int not null default 0 check (experience_years >= 0),
  price numeric(10,2) not null default 0 check (price >= 0),
  bio text default '',
  avatar_emoji text default '🧰',
  is_available boolean not null default true,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. BOOKINGS
-- ============================================================
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_code text not null unique,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  service_category text not null,
  booking_date date not null,
  booking_time text not null,
  location text not null,
  description text default '',
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bookings_customer on public.bookings(customer_id);
create index if not exists idx_bookings_provider on public.bookings(provider_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_bookings_updated_at on public.bookings;
create trigger trg_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create or replace function public.enforce_booking_transition()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'UPDATE' then
    if old.status = 'completed' and new.status is distinct from old.status then
      raise exception 'A completed booking cannot be modified.';
    end if;
    if old.status = 'rejected' and new.status in ('in_progress', 'completed', 'accepted') then
      raise exception 'A rejected booking cannot be moved forward.';
    end if;
    if new.status = 'in_progress' and old.status <> 'accepted' then
      raise exception 'Only an accepted booking can move to in progress.';
    end if;
    if new.status = 'completed' and old.status <> 'in_progress' then
      raise exception 'Only an in-progress booking can be marked completed.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_booking_transition on public.bookings;
create trigger trg_booking_transition
before update on public.bookings
for each row execute function public.enforce_booking_transition();

-- ============================================================
-- 4. REVIEWS
-- ============================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text default '',
  created_at timestamptz not null default now()
);

create or replace function public.enforce_review_rules()
returns trigger language plpgsql as $$
declare
  b_status text;
begin
  select status into b_status from public.bookings where id = new.booking_id;
  if b_status is distinct from 'completed' then
    raise exception 'You can only review a completed booking.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_review_rules on public.reviews;
create trigger trg_review_rules
before insert on public.reviews
for each row execute function public.enforce_review_rules();

create or replace function public.refresh_provider_rating()
returns trigger language plpgsql as $$
begin
  update public.provider_profiles pp
  set rating_count = sub.cnt,
      rating_avg = sub.avg_rating
  from (
    select provider_id, count(*) cnt, round(avg(rating)::numeric, 2) avg_rating
    from public.reviews
    where provider_id = new.provider_id
    group by provider_id
  ) sub
  where pp.id = sub.provider_id;
  return new;
end;
$$;

drop trigger if exists trg_refresh_rating on public.reviews;
create trigger trg_refresh_rating
after insert on public.reviews
for each row execute function public.refresh_provider_rating();

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;

create policy "profiles are readable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "users insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "provider profiles are publicly readable"
  on public.provider_profiles for select
  using (true);

create policy "provider inserts own provider profile"
  on public.provider_profiles for insert
  with check (auth.uid() = id);

create policy "provider updates own provider profile"
  on public.provider_profiles for update
  using (auth.uid() = id);

create policy "participants can read bookings"
  on public.bookings for select
  using (auth.uid() = customer_id or auth.uid() = provider_id);

create policy "customers create bookings for themselves"
  on public.bookings for insert
  with check (auth.uid() = customer_id);

create policy "participants can update their bookings"
  on public.bookings for update
  using (auth.uid() = customer_id or auth.uid() = provider_id);

create policy "reviews are publicly readable"
  on public.reviews for select
  using (true);

create policy "customers review their own completed bookings"
  on public.reviews for insert
  with check (
    auth.uid() = customer_id
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.customer_id = auth.uid()
        and b.status = 'completed'
    )
  );

-- ============================================================
-- 6. SEED DATA (optional demo providers — safe to skip)
-- ============================================================
-- insert into public.profiles (id, full_name, role) values
--   ('00000000-0000-0000-0000-000000000001', 'Ayesha Khan', 'provider');
-- insert into public.provider_profiles (id, service_category, location, experience_years, price, bio, avatar_emoji) values
--   ('00000000-0000-0000-0000-000000000001', 'Home Cleaning', 'Karachi, PK', 4, 1500, 'Deep cleaning specialist.', '🧹');
