import { supabase, isSupabaseConfigured } from "@/config/supabase";
import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useSupabaseWallets(uid?: string | null) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!uid) { setData([]); setLoading(false); return; }
    if (!isSupabaseConfigured) {
      const raw = await AsyncStorage.getItem("mock_wallets");
      setData(raw ? JSON.parse(raw) : []);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: wallets, error } = await supabase.from("wallets").select("*").eq("uid", uid).order("created_at", { ascending: false });
    if (error) setError(error.message);
    else { setData(wallets as any); setError(null); }
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    fetch();
    if (!uid || !isSupabaseConfigured) return;
    const channel = supabase.channel(`wallets-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "wallets", filter: `uid=eq.${uid}` }, () => fetch())
      .subscribe();
    const id = setInterval(fetch, 3000);
    return () => { supabase.removeChannel(channel); clearInterval(id); };
  }, [fetch, uid]);

  return { data, loading, error, refetch: fetch };
}

export function useSupabaseTransactions(uid?: string | null, limit = 30) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!uid) { setData([]); setLoading(false); return; }
    if (!isSupabaseConfigured) {
      const raw = await AsyncStorage.getItem("mock_transactions");
      const parsed = raw ? JSON.parse(raw) : [];
      setData(parsed.slice(0, limit) as any);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: txs, error } = await supabase.from("transactions").select("*").eq("uid", uid).order("date", { ascending: false }).limit(limit);
    if (error) setError(error.message);
    else { 
      const mapped = (txs as any[]).map(t => ({ ...t, date: t.date, created: t.created_at }));
      setData(mapped); setError(null); 
    }
    setLoading(false);
  }, [uid, limit]);

  useEffect(() => {
    fetch();
    if (!uid || !isSupabaseConfigured) return;
    const channel = supabase.channel(`txs-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `uid=eq.${uid}` }, () => fetch())
      .subscribe();
    const id = setInterval(fetch, 3000);
    return () => { supabase.removeChannel(channel); clearInterval(id); };
  }, [fetch, uid]);

  return { data, loading, error, refetch: fetch };
}
