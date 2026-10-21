import { supabase, isSupabaseConfigured } from "@/config/supabase";
import { useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TransactionType } from "@/types";

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
      const cached = await AsyncStorage.getItem(`wallets_${uid}`)
        || (!isSupabaseConfigured ? await AsyncStorage.getItem("mock_wallets") : null);
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
  const dataRef = useRef<any[]>([]);
  const offsetRef = useRef(0);
  const requestRef = useRef(0);
  const appendInFlightRef = useRef(false);

  const fetch = useCallback(async (silent = false, append = false) => {
    if (!uid) {
      dataRef.current = [];
      offsetRef.current = 0;
      setData([]);
      setError(null);
      setHasMore(false);
      setLoading(false);
      return;
    }
    if (append && appendInFlightRef.current) return;
    if (append) appendInFlightRef.current = true;
    if (!silent || append) setLoading(true);
    const requestId = ++requestRef.current;
    const currentOffset = append ? offsetRef.current : 0;
    if (!isSupabaseConfigured) {
      try {
        const raw = await AsyncStorage.getItem("mock_transactions");
        const parsed = raw ? JSON.parse(raw) : [];
        if (requestId !== requestRef.current) return;
        const slice = parsed.slice(currentOffset, currentOffset + limit);
        const next = append ? [...dataRef.current, ...slice] : slice;
        dataRef.current = next;
        offsetRef.current = currentOffset + slice.length;
        setData(next);
        setError(null);
        setHasMore(false);
      } catch (e: any) {
        setError(e?.message || "Impossible de charger les transactions.");
      } finally {
        if (requestId === requestRef.current) setLoading(false);
        if (append) appendInFlightRef.current = false;
      }
      return;
    }
    try {
      const { data: txs, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("uid", uid)
        .order("date", { ascending: false })
        .range(currentOffset, currentOffset + limit - 1);
      if (error) throw error;
      if (requestId !== requestRef.current) return;
      const mapped = (txs || []).map((t: TransactionType & { created_at?: string }) => ({
        ...t,
        date: t.date,
        created: t.created_at,
      }));
      const next = append ? [...dataRef.current, ...mapped] : mapped;
      dataRef.current = next;
      offsetRef.current = currentOffset + mapped.length;
      setData(next);
      setHasMore(mapped.length === limit);
      setError(null);
      try {
        await AsyncStorage.setItem(`txs_${uid}`, JSON.stringify(next));
        await AsyncStorage.setItem("mock_transactions", JSON.stringify(next));
      } catch (cacheError: any) {
        console.warn("[transactions] Cache local indisponible :", cacheError?.message || cacheError);
      }
    } catch (e: any) {
      if (requestId !== requestRef.current) return;
      let cached: string | null = null;
      try {
        cached = await AsyncStorage.getItem(`txs_${uid}`)
          || (!isSupabaseConfigured ? await AsyncStorage.getItem("mock_transactions") : null);
      } catch (cacheError: any) {
        console.warn("[transactions] Lecture du cache local impossible :", cacheError?.message || cacheError);
      }
      if (cached) {
        try {
          const restored = JSON.parse(cached).slice(0, limit);
          dataRef.current = restored;
          offsetRef.current = restored.length;
          setData(restored);
          setHasMore(false);
          setError(null);
        } catch (cacheError: any) {
          console.warn("[transactions] Cache local invalide :", cacheError?.message || cacheError);
          setError(e?.message || "Impossible de charger les transactions.");
        }
      } else {
        setError(e?.message || "Impossible de charger les transactions.");
      }
    } finally {
      if (requestId === requestRef.current) setLoading(false);
      if (append) appendInFlightRef.current = false;
    }
  }, [uid, limit]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) void fetch(true, true);
  }, [fetch, hasMore, loading]);

  useEffect(() => {
    dataRef.current = [];
    offsetRef.current = 0;
    setData([]);
    setError(null);
    setHasMore(true);
    setLoading(true);
    void fetch(false);
    return () => {
      requestRef.current += 1;
    };
  }, [fetch]);

  return { data, loading, error, refetch: fetch, hasMore, loadMore };
}
