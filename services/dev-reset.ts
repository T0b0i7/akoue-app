import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/config/supabase";

// Reset usine local : supprime TOUS les comptes locaux + caches
// pour revoir la logique d'inscription / connexion depuis zéro.
// Ne touche pas à Supabase distant (voir WIPE_SQL ci-dessous).
export async function resetLocalToZero(): Promise<void> {
  try {
    await supabase.auth.signOut().catch(() => {});
  } catch {}
  try {
    const keys = await AsyncStorage.getAllKeys();
    // on garde uniquement langue + thème appareil
    const toRemove = keys.filter((k) => k !== "app_locale" && k !== "app_theme");
    if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
  } catch {}
}

// À exécuter dans Supabase Dashboard > SQL Editor (service_role implicite)
// pour vider les données de test. Les auth.users se suppriment ensuite
// dans Authentication > Users (sélection multiple > Delete), car le
// schéma auth n'est pas modifiable en SQL simple.
export const WIPE_SQL = `-- Akouè — remise à zéro (données de test)
truncate public.transactions, public.wallets, public.profiles restart identity cascade;
-- ensuite : Dashboard > Authentication > Users > Delete all
`;
