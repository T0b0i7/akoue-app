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
    // Poll silencieux toutes les 15s (realtime désactivé pour éviter crash web StrictMode)
    const id = setInterval(() => fetch(true), 15000);
    return () => clearInterval(id);
  }, [fetch, uid]);

  return { data, loading, error, refetch: fetch };
}

export function useSupabaseTransactions(uid?: string | null, limit = 30) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (silent = false) => {
    if (!uid) { setData([]); setLoading(false); return; }
    if (!isSupabaseConfigured) {
      const raw = await AsyncStorage.getItem("mock_transactions");
      const parsed = raw ? JSON.parse(raw) : [];
      setData(parsed.slice(0, limit) as any);
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const { data: txs, error } = await supabase.from("transactions").select("*").eq("uid", uid).order("date", { ascending: false }).limit(limit);
      if (error) throw error;
      const mapped = (txs as any[]).map(t => ({ ...t, date: t.date, created: t.created_at }));
      setData(mapped); setError(null);
      await AsyncStorage.setItem(`txs_${uid}`, JSON.stringify(mapped));
      await AsyncStorage.setItem("mock_transactions", JSON.stringify(mapped));
    } catch (e: any) {
      const cached = await AsyncStorage.getItem(`txs_${uid}`) || await AsyncStorage.getItem("mock_transactions");
      if (cached) { setData(JSON.parse(cached).slice(0, limit)); setError(null); }
      else setError(e.message || "Hors ligne");
      setLoading(false); return;
    }
    setLoading(false);
  }, [uid, limit]);

  useEffect(() => {
    fetch(false);
    if (!uid || !isSupabaseConfigured) return;
    const id = setInterval(() => fetch(true), 15000);
    return () => clearInterval(id);
  }, [fetch, uid]);

  return { data, loading, error, refetch: fetch };
}
