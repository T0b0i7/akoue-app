-- Les annonces actives sont publiques : autorise aussi les visiteurs non
-- connectes (web avant login) a les lire. Sans ca, l'app recoit des 400
-- en boucle sur la page d'inscription.
-- A executer dans Supabase Dashboard > SQL Editor.

drop policy if exists "broadcasts_read" on public.broadcasts;

create policy "broadcasts_read" on public.broadcasts
for select using (active = true);
