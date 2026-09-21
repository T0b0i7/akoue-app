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
    const { data: wallets, error } = await supabase.from("wallets").select("*").eq("uid", uid).order("created_at", { ascending: false });
    if (error) setError(error.message);
    else { setData(wallets as any); setError(null); }
    setLoading(false);
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
    const { data: txs, error } = await supabase.from("transactions").select("*").eq("uid", uid).order("date", { ascending: false }).limit(limit);
    if (error) setError(error.message);
    else { 
      const mapped = (txs as any[]).map(t => ({ ...t, date: t.date, created: t.created_at }));
      setData(mapped); setError(null); 
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
