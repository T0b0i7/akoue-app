import { supabase, isSupabaseConfigured } from "@/config/supabase";
import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useSupabaseWallets(uid?: string | null) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (silent = false) => {
    if (!uid) { setData([]); setLoading(false); return; }
    if (!isSupabaseConfigured) {
      const raw = await AsyncStorage.getItem("mock_wallets");
      setData(raw ? JSON.parse(raw) : []);
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const { data: wallets, error } = await supabase.from("wallets").select("*").eq("uid", uid).order("created_at", { ascending: false });
      if (error) throw error;
      setData(wallets as any); setError(null);
      // cache offline
      await AsyncStorage.setItem(`wallets_${uid}`, JSON.stringify(wallets));
      await AsyncStorage.setItem("mock_wallets", JSON.stringify(wallets));
    } catch (e: any) {
      // Hors ligne → fallback cache
      const cached = await AsyncStorage.getItem(`wallets_${uid}`) || await AsyncStorage.getItem("mock_wallets");
      if (cached) { setData(JSON.parse(cached)); setError(null); }
      else setError(e.message || "Hors ligne");
    } finally { setLoading(false); }
  }, [uid]);

  useEffect(() => {
    fetch(false);
    if (!uid || !isSupabaseConfigured) return;
    // Rechargement au focus via useFocusEffect dans l'écran appelant.
    // Pas de polling automatique : évite les requêtes réseau inutiles
    // et la surconsommation batterie sur mobile.
  }, [fetch, uid]);

  return { data, loading, error, refetch: fetch };
}

export function useSupabaseTransactions(uid?: string | null, limit = 30) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetch = useCallback(async (silent = false, append = false) => {
    if (!uid) { setData([]); setLoading(false); return; }
    if (!isSupabaseConfigured) {
      const raw = await AsyncStorage.getItem("mock_transactions");
      const parsed = raw ? JSON.parse(raw) : [];
      const slice = parsed.slice(0, limit);
      setData(append ? [...data, ...slice] : slice);
      setHasMore(false);
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const { data: txs, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("uid", uid)
        .order("date", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      const mapped = (txs as any[]).map(t => ({ ...t, date: t.date, created: t.created_at }));
      const next = append ? [...data, ...mapped] : mapped;
      setData(next);
      setHasMore(mapped.length === limit);
      setError(null);
      await AsyncStorage.setItem(`txs_${uid}`, JSON.stringify(next));
      await AsyncStorage.setItem("mock_transactions", JSON.stringify(next));
    } catch (e: any) {
      const cached = await AsyncStorage.getItem(`txs_${uid}`) || await AsyncStorage.getItem("mock_transactions");
      if (cached) { setData(JSON.parse(cached).slice(0, limit)); setError(null); }
      else setError(e.message || "Hors ligne");
      setLoading(false); return;
    } finally { setLoading(false); }
  }, [uid, limit, offset, data]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) setOffset(o => o + limit);
  }, [hasMore, loading, limit]);

  useEffect(() => {
    fetch(false);
    if (!uid || !isSupabaseConfigured) return;
    // Rechargement au focus via useFocusEffect dans l'écran appelant.
    // Pas de polling automatique : évite les requêtes réseau inutiles
    // et la surconsommation batterie sur mobile.
  }, [fetch, uid]);

  return { data, loading, error, refetch: fetch, hasMore, loadMore };
}
