-- Akouè Admin Web (version HTML/CSS/JS, sans serveur)
-- À exécuter UNE fois dans Supabase Dashboard > SQL Editor
-- La sécurité passe par le RLS : seul un email présent dans admin_users
-- peut lire les données et gérer les broadcasts.

-- 1. Table des admins
create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz default now()
);
alter table public.admin_users enable row level security;
drop policy if exists "admin_users_read" on public.admin_users;
create policy "admin_users_read" on public.admin_users
  for select using (auth.role() = 'authenticated');

insert into public.admin_users(email) values ('abattieucher@gmail.com')
on conflict do nothing;

-- 2. Email visible dans les profils (rempli à l'inscription côté app)
alter table public.profiles add column if not exists email text;

-- Rattrapage des comptes déjà inscrits :
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- 3. Lecture admin : voit TOUT (les policies "own" des users restent inchangées)
drop policy if exists "profiles_admin_read" on public.profiles;
create policy "profiles_admin_read" on public.profiles
  for select using (exists (
    select 1 from public.admin_users where email = (auth.jwt() ->> 'email')));

drop policy if exists "wallets_admin_read" on public.wallets;
create policy "wallets_admin_read" on public.wallets
  for select using (exists (
    select 1 from public.admin_users where email = (auth.jwt() ->> 'email')));

drop policy if exists "transactions_admin_read" on public.transactions;
create policy "transactions_admin_read" on public.transactions
  for select using (exists (
    select 1 from public.admin_users where email = (auth.jwt() ->> 'email')));

-- 4. Broadcasts : l'admin gère tout (créer / activer / supprimer)
-- La lecture publique existante pour l'app mobile ("broadcasts_read") est conservée.
drop policy if exists "broadcasts_admin_all" on public.broadcasts;
create policy "broadcasts_admin_all" on public.broadcasts
  for all using (exists (
    select 1 from public.admin_users where email = (auth.jwt() ->> 'email')))
  with check (exists (
    select 1 from public.admin_users where email = (auth.jwt() ->> 'email')));
