-- Akouè — Schema Supabase (Postgres + RLS)
-- Projet: akoue-app
-- Exécuter dans Supabase Dashboard > SQL Editor

-- 1. Profiles (lié à auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  image text,
  created_at timestamptz default now()
);

-- 2. Wallets
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null references auth.users(id) on delete cascade,
  name text not null,
  image text,
  amount numeric default 0,
  "totalIncome" numeric default 0,
  "totalExpenses" numeric default 0,
  currency text default 'XOF',
  created_at timestamptz default now()
);
-- ajout colonne currency si table existait avant
alter table public.wallets add column if not exists currency text default 'XOF';

-- 3. Transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null references auth.users(id) on delete cascade,
  "walletId" uuid not null references public.wallets(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  amount numeric not null check (amount > 0),
  category text,
  description text,
  image text,
  date timestamptz not null default now(),
  created_at timestamptz default now()
);

-- Index pour perfs
create index if not exists idx_wallets_uid on public.wallets(uid);
create index if not exists idx_transactions_uid on public.transactions(uid);
create index if not exists idx_transactions_wallet on public.transactions("walletId");
create index if not exists idx_transactions_date on public.transactions(date desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;

-- Policies: chaque user ne voit que ses données (uid = auth.uid())
drop policy if exists "profiles_own" on public.profiles;
create policy "profiles_own" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "wallets_own" on public.wallets;
create policy "wallets_own" on public.wallets for all using (auth.uid() = uid) with check (auth.uid() = uid);

drop policy if exists "transactions_own" on public.transactions;
create policy "transactions_own" on public.transactions for all using (auth.uid() = uid) with check (auth.uid() = uid);

-- Storage bucket pour reçus
insert into storage.buckets (id, name, public) values ('receipts','receipts', true)
on conflict (id) do nothing;

drop policy if exists "receipts_own" on storage.objects;
create policy "receipts_own" on storage.objects for all using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Broadcasts (messages admin -> tous les users, offline via cache)
create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.broadcasts enable row level security;
drop policy if exists "broadcasts_read" on public.broadcasts;
create policy "broadcasts_read" on public.broadcasts for select using (active = true);
-- seul service_role peut insert/update/delete (pas de policy insert pour anon/auth)

create index if not exists idx_broadcasts_active_created on public.broadcasts(active, created_at desc);

-- Vue stats rapide (remplace l'agrégation client Firestore)
create or replace view public.wallet_stats as
select
  "walletId",
  uid,
  sum(case when type='income' then amount else 0 end) as income,
  sum(case when type='expense' then amount else 0 end) as expense,
  sum(case when type='income' then amount else -amount end) as balance
from public.transactions group by "walletId", uid;
