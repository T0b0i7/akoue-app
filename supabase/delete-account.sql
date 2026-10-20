-- Suppression complete de compte : efface l'utilisateur auth (l'activation)
-- + profiles, wallets, transactions via ON DELETE CASCADE.
-- A executer UNE fois dans Supabase Dashboard > SQL Editor.
-- Apres ca, le meme email peut se reinscrire proprement.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
