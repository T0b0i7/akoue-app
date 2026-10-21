-- Historique et protection contre les envois d'e-mail en double.
create table if not exists public.broadcast_email_deliveries (
  broadcast_id uuid primary key references public.broadcasts(id) on delete cascade,
  status text not null check (status in ('sending', 'sent', 'failed')),
  recipient_count integer not null default 0 check (recipient_count >= 0),
  sent_count integer not null default 0 check (sent_count >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.broadcast_email_deliveries enable row level security;
drop policy if exists "broadcast_email_deliveries_admin_all" on public.broadcast_email_deliveries;
create policy "broadcast_email_deliveries_admin_all"
  on public.broadcast_email_deliveries
  for all
  using (exists (
    select 1 from public.admin_users
    where email = (auth.jwt() ->> 'email')
  ))
  with check (exists (
    select 1 from public.admin_users
    where email = (auth.jwt() ->> 'email')
  ));
