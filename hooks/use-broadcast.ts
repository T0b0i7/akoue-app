import { useCallback, useEffect, useRef } from "react";
import { Alert, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, isSupabaseConfigured } from "@/config/supabase";
import { useToast } from "@/context/toast-context";

const CACHE_KEY = "cached_broadcasts";
const SEEN_KEY = "seen_broadcasts"; // JSON array of ids

const isOfflineError = (msg: string) => /fetch|network|offline|Failed to fetch|Network request failed/i.test(msg || "");

async function getSeen(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
async function markSeen(id: string) {
  try {
    const seen = await getSeen();
    if (!seen.includes(id)) {
      seen.push(id);
      await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    }
  } catch {}
}

export function useBroadcast() {
  const { showToast } = useToast();
  const fetching = useRef(false);

  const fetchAndShow = useCallback(async (silent = true) => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      let broadcasts: any[] = [];

      if (!isSupabaseConfigured) {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        broadcasts = raw ? JSON.parse(raw) : [];
      } else {
        try {
          const { data, error } = await supabase
            .from("broadcasts")
            .select("id,title,body,created_at")
            .eq("active", true)
            .order("created_at", { ascending: false })
            .limit(5);
          if (error) throw error;
          broadcasts = data || [];
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(broadcasts));
        } catch (e: any) {
          if (isOfflineError(e.message)) {
            const raw = await AsyncStorage.getItem(CACHE_KEY);
            broadcasts = raw ? JSON.parse(raw) : [];
          } else throw e;
        }
      }

      if (!broadcasts.length) return;
      const seen = await getSeen();
      const unseen = broadcasts.filter((b) => !seen.includes(b.id));
      if (!unseen.length) return;

      // affiche le plus récent non vu
      const latest = unseen[0];
      if (silent) {
        showToast("success", latest.title, latest.body);
      } else {
        Alert.alert(latest.title, latest.body, [
          { text: "OK", onPress: () => markSeen(latest.id) },
          { text: "Plus tard", style: "cancel" },
        ]);
        // marque comme vu après affichage toast aussi
        await markSeen(latest.id);
        return;
      }
      // en silent on marque comme vu pour ne pas re-spammer, mais on laisse Alert pour le prochain focus si besoin
      await markSeen(latest.id);

      // si plusieurs non vus, on les notifie en toast séquentiel
      if (unseen.length > 1) {
        for (let i = 1; i < unseen.length; i++) {
          setTimeout(() => showToast("success", unseen[i].title, unseen[i].body), i * 4000);
          await markSeen(unseen[i].id);
        }
      }
    } catch {}
    finally { fetching.current = false; }
  }, [showToast]);

  useEffect(() => {
    // premier fetch 4s après lancement (laisse OTA + auth se faire)
    const t = setTimeout(() => fetchAndShow(true), 4000);
    return () => clearTimeout(t);
  }, [fetchAndShow]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") fetchAndShow(true);
    });
    return () => sub.remove();
  }, [fetchAndShow]);

  // poll toutes les 60s quand en ligne
  useEffect(() => {
    const id = setInterval(() => fetchAndShow(true), 60000);
    return () => clearInterval(id);
  }, [fetchAndShow]);

  return { fetchAndShow, markSeen };
}
