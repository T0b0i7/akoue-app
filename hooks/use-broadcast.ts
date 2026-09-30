import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, isSupabaseConfigured } from "@/config/supabase";
import { useToast } from "@/context/toast-context";
import * as Notifications from "expo-notifications";
import * as Application from "expo-application";
import { downloadAndInstallApk } from "@/services/app-update-service";
import type { PendingUpdate } from "@/components/update-modal";

const CACHE_KEY = "cached_broadcasts";
const SEEN_KEY = "seen_broadcasts"; // ids définitivement traités
const NOTIFIED_KEY = "notified_broadcasts"; // ids déjà envoyés en notif système (1 seule fois)
const SNOOZE_PREFIX = "snoozed_bc_"; // timestamp "plus tard" → re-propose après 24h, pas 60s
const SNOOZE_MS = 24 * 60 * 60 * 1000;

const isOfflineError = (msg: string) => /fetch|network|offline|Failed to fetch|Network request failed/i.test(msg || "");

async function getIds(key: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
async function addId(key: string, id: string) {
  try {
    const list = await getIds(key);
    if (!list.includes(id)) {
      list.push(id);
      await AsyncStorage.setItem(key, JSON.stringify(list));
    }
  } catch {}
}
async function isSnoozed(id: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SNOOZE_PREFIX + id);
    if (!raw) return false;
    return Date.now() - Number(raw) < SNOOZE_MS;
  } catch { return false; }
}

// Compare deux versions "1.2.3" → true si a < b
function isNewer(a: string | null, b: string | null): boolean {
  if (!b) return true; // pas de version cible = concerne tout le monde
  if (!a) return true;
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pb[i] || 0) > (pa[i] || 0)) return true;
    if ((pb[i] || 0) < (pa[i] || 0)) return false;
  }
  return false;
}

async function setupUpdateCategory() {
  try {
    if (Platform.OS === "web") return;
    await Notifications.setNotificationCategoryAsync("app-update", [
      {
        identifier: "update-now",
        buttonTitle: "Mettre à jour",
        options: { opensAppToForeground: true },
      },
    ]);
  } catch {}
}

export function useBroadcast() {
  const { showToast } = useToast();
  const fetching = useRef(false);
  const [update, setUpdate] = useState<PendingUpdate | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const listRef = useRef<any[]>([]);

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
            .select("id,title,body,details,version,kind,action_url,action_label,created_at")
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
      listRef.current = broadcasts;
      const seen = await getIds(SEEN_KEY);
      const installed = Application.nativeApplicationVersion || null;
      const candidates: any[] = [];
      for (const b of broadcasts) {
        if (seen.includes(b.id)) continue;
        if (await isSnoozed(b.id)) continue;
        // Déjà à jour ? → marqué vu, jamais re-proposé (fini la notif à chaque entrée)
        if (b.version && !isNewer(installed, b.version)) {
          await addId(SEEN_KEY, b.id);
          continue;
        }
        candidates.push(b);
      }
      if (!candidates.length) return;

      const latest = candidates[0];

      // Notif système UNE SEULE FOIS par broadcast (fini le spam toutes les 60s)
      try {
        if (Platform.OS !== "web") {
          const notified = await getIds(NOTIFIED_KEY);
          if (!notified.includes(latest.id)) {
            const perms = await Notifications.getPermissionsAsync();
            if (perms.status === "granted") {
              const isUpdate = latest.kind === "update" && latest.action_url;
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: latest.title,
                  body: latest.body,
                  sound: true,
                  ...(isUpdate
                    ? { categoryIdentifier: "app-update", data: { broadcastId: latest.id, actionUrl: latest.action_url } }
                    : { data: { broadcastId: latest.id } }),
                },
                trigger: null,
              });
              await addId(NOTIFIED_KEY, latest.id);
            }
          }
        }
      } catch {}

      // MAJ avec bouton : écran dédié, court, sans long lien à lire
      if (latest.kind === "update" && latest.action_url) {
        setDownloading(false);
        setUpdate({
          id: latest.id,
          title: latest.title,
          body: latest.body,
          details: latest.details || null,
          url: latest.action_url,
          label: latest.action_label || "Mettre à jour",
        });
        return;
      }

      // Info simple : toast + Alert, OK = vu définitivement
      showToast("success", latest.title, latest.body);
      setTimeout(() => {
        Alert.alert(latest.title, latest.body, [
          { text: "OK", onPress: () => addId(SEEN_KEY, latest.id) },
          {
            text: "Plus tard",
            style: "cancel",
            onPress: () => AsyncStorage.setItem(SNOOZE_PREFIX + latest.id, String(Date.now())).catch(() => {}),
          },
        ]);
      }, silent ? 800 : 0);

      if (candidates.length > 1) {
        for (let i = 1; i < candidates.length; i++) {
          setTimeout(() => showToast("success", candidates[i].title, candidates[i].body), i * 4000);
        }
      }
    } catch {}
    finally { fetching.current = false; }
  }, [showToast]);

  // Bouton "Mettre à jour" : téléchargement direct dans l'app + installeur.
  // Marque TOUTES les annonces vues d'un coup (fini les vieilles qui reviennent).
  const openUpdate = useCallback(async () => {
    if (!update) return;
    setBusy(true);
    for (const b of listRef.current) {
      await addId(SEEN_KEY, b.id);
    }
    if (Platform.OS === "android" && update.url.endsWith(".apk")) {
      setDownloading(true);
      setProgress(0);
      setBusy(false);
      const r = await downloadAndInstallApk(update.url, (ratio) => setProgress(ratio));
      if (!r.ok) {
        showToast("error", "Mise à jour", r.error || "Échec.");
        setDownloading(false);
        setProgress(null);
        setBusy(false);
        return;
      }
      setProgress(1);
      setBusy(false);
      return; // l'installeur Android a pris le relais, l'écran d'étapes reste affiché
    }
    try {
      await Linking.openURL(update.url);
    } catch {}
    setDownloading(true);
    setBusy(false);
  }, [update]);

  // "Plus tard" : snooze 24h, pas 60s
  const laterUpdate = useCallback(async () => {
    if (!update) return;
    await AsyncStorage.setItem(SNOOZE_PREFIX + update.id, String(Date.now())).catch(() => {});
    setUpdate(null);
    setDownloading(false);
  }, [update]);

  // Écran de chargement fermé : ne plus jamais re-proposer (tout est marqué vu)
  const doneUpdate = useCallback(async () => {
    for (const b of listRef.current) {
      await addId(SEEN_KEY, b.id);
    }
    if (update) await addId(SEEN_KEY, update.id);
    setUpdate(null);
    setDownloading(false);
    setProgress(null);
  }, [update]);

  useEffect(() => {
    setupUpdateCategory();
    const t = setTimeout(() => fetchAndShow(true), 2500);
    return () => clearTimeout(t);
  }, [fetchAndShow]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") fetchAndShow(true);
    });
    return () => sub.remove();
  }, [fetchAndShow]);

  useEffect(() => {
    const id = setInterval(() => fetchAndShow(true), 60000);
    return () => clearInterval(id);
  }, [fetchAndShow]);

  // Clic notif système ou bouton "Mettre à jour" de la notif
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = Notifications.addNotificationResponseReceivedListener(async (resp) => {
      const data = resp.notification.request.content.data as any;
      if (data?.actionUrl) {
        try { await Linking.openURL(data.actionUrl); } catch {}
        if (data?.broadcastId) await addId(SEEN_KEY, data.broadcastId);
        setDownloading(true);
        // recharge le broadcast pour l'écran d'attente
        try {
          const { data: row } = await supabase.from("broadcasts").select("id,title,body").eq("id", data.broadcastId).single();
          if (row) setUpdate({ id: (row as any).id, title: (row as any).title, body: (row as any).body, details: null, url: data.actionUrl, label: "Mettre à jour" });
        } catch {}
      } else if (data?.broadcastId) {
        fetchAndShow(false);
      }
    });
    return () => sub.remove();
  }, [fetchAndShow]);

  return { fetchAndShow, update, downloading, busy, progress, openUpdate, laterUpdate, doneUpdate };
}
