import { ResponseType, WalletType } from "@/types";
import { supabase } from "@/config/supabase";
import { uploadFileToSupabase } from "./images-service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";

const walletSchema = z.object({
  name: z.string().trim().min(1).max(50),
  amount: z.number().min(0).max(1_000_000_000).optional(),
  currency: z.string().trim().length(3).regex(/^[A-Z]{3}$/).optional(),
  image: z.any().optional(),
  id: z.string().uuid().optional(),
});

const isNetworkError = (msg: string) => /fetch|network|offline|Failed to fetch/i.test(msg || "");

// Traduit les erreurs techniques en messages compréhensibles
export const humanizeError = (msg: string): string => {
  if (!msg) return "Une erreur inconnue est survenue";
  if (msg.includes("row-level security") || msg.includes("RLS"))
    return "Vous n'êtes pas connecté(e). Connectez-vous pour ajouter un portefeuille.";
  if (msg.includes("duplicate key") || msg.includes("unique"))
    return "Ce portefeuille existe déjà.";
  if (msg.includes("violates foreign key"))
    return "Référence invalide. Réessayez.";
  if (msg.includes("permission") || msg.includes("unauthorized") || msg.includes("401"))
    return "Session expirée. Reconnectez-vous.";
  if (msg.includes("value too long"))
    return "Le nom est trop long (max 50 caractères).";
  if (msg.includes("invalid input syntax") || msg.includes("invalid"))
    return "Données invalides. Vérifiez le formulaire.";
  if (msg.includes("network") || msg.includes("fetch"))
    return "Problème de connexion internet. Réessayez.";
  return "Une erreur est survenue. Réessayez.";
};
const cacheKey = (uid: string) => `wallets_${uid}`;

async function cacheWalletLocal(wallet: any, uid: string) {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(uid));
    const list = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((w: any) => w.id === wallet.id);
    if (idx >= 0) list[idx] = wallet; else list.unshift(wallet);
    await AsyncStorage.setItem(cacheKey(uid), JSON.stringify(list));
    await AsyncStorage.setItem("mock_wallets", JSON.stringify(list));
    // queue for sync
    const qRaw = await AsyncStorage.getItem("pending_wallets");
    const q = qRaw ? JSON.parse(qRaw) : [];
    q.push({ ...wallet, _pending: true, _uid: uid });
    await AsyncStorage.setItem("pending_wallets", JSON.stringify(q));
  } catch {}
}

export const createOrUpdateWallet = async (walletData: Partial<WalletType>): Promise<ResponseType> => {
  try {
    // validation stricte
    const parsed = walletSchema.safeParse({
      name: walletData.name,
      amount: walletData.amount !== undefined ? Number(walletData.amount) : undefined,
      currency: (walletData as any).currency,
      image: walletData.image,
      id: (walletData as any).id,
    });
    if (!parsed.success) return { success: false, msg: parsed.error.issues[0]?.message || "Données invalides" };
    let imageUrl = walletData.image;
    if (walletData.image && (walletData.image as any)?.uri) {
      const res = await uploadFileToSupabase(walletData.image as any, "wallets");
      if (!res.success) return { success: false, msg: "Failed to upload wallet image" };
      imageUrl = res.data;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const uid = walletData.uid || (user as any)?.id || (walletData as any)?.uid;
    // auth-context stocke uid, supabase renvoie id — on couvre les deux
    const finalUid = uid || (await supabase.auth.getSession()).data.session?.user?.id;
    if (!finalUid) return { success: false, msg: "User not authenticated" };

    const initialAmount = Number(walletData.amount || 0);
    const currency = (walletData as any).currency || "XOF";
    if (!walletData.id) {
      const payload: any = {
        uid: finalUid,
        name: walletData.name,
        image: typeof imageUrl === "string" ? imageUrl : null,
        amount: initialAmount,
        totalIncome: initialAmount > 0 ? initialAmount : 0,
        totalExpenses: 0,
        currency,
      };
      const { data, error } = await supabase
        .from("wallets")
        .insert(payload)
        .select()
        .single();
      if (error) {
        // si colonne currency n'existe pas encore, retry sans elle
        if (error.message?.includes("currency")) {
          delete payload.currency;
          const retry = await supabase.from("wallets").insert(payload).select().single();
          if (!retry.error) {
            try {
              const raw = await AsyncStorage.getItem(cacheKey(finalUid));
              const list = raw ? JSON.parse(raw) : [];
              const toCache = { ...retry.data, currency };
              list.unshift(toCache);
              await AsyncStorage.setItem(cacheKey(finalUid), JSON.stringify(list));
              await AsyncStorage.setItem("mock_wallets", JSON.stringify(list));
            } catch {}
            return { success: true, data: { ...retry.data, currency, id: retry.data.id } };
          }
        }
        if (isNetworkError(error.message)) {
          const local = { id: `local-${Date.now()}`, uid: finalUid, name: walletData.name, image: typeof imageUrl === "string" ? imageUrl : null, amount: initialAmount, totalIncome: initialAmount > 0 ? initialAmount : 0, totalExpenses: 0, currency, created_at: new Date().toISOString(), _offline: true };
          await cacheWalletLocal(local, finalUid);
          return { success: true, data: local };
        }
        // RLS bloqué (pas de session Supabase) → sauvegarde locale
        if (error.message?.includes("row-level security")) {
          const local = { id: `local-${Date.now()}`, uid: finalUid, name: walletData.name, image: typeof imageUrl === "string" ? imageUrl : null, amount: initialAmount, totalIncome: initialAmount > 0 ? initialAmount : 0, totalExpenses: 0, currency, created_at: new Date().toISOString(), _offline: true };
          await cacheWalletLocal(local, finalUid);
          return { success: true, data: local };
        }
        return { success: false, msg: humanizeError(error.message) };
      }
      // cache success
      try {
        const raw = await AsyncStorage.getItem(cacheKey(finalUid));
        const list = raw ? JSON.parse(raw) : [];
        list.unshift(data);
        await AsyncStorage.setItem(cacheKey(finalUid), JSON.stringify(list));
        await AsyncStorage.setItem("mock_wallets", JSON.stringify(list));
      } catch {}
      return { success: true, data: { ...data, id: data.id } };
    } else {
      const upd: any = { name: walletData.name, image: imageUrl };
      if (walletData.amount !== undefined) upd.amount = walletData.amount;
      if ((walletData as any).currency) upd.currency = (walletData as any).currency;
      // ne pas écraser totalIncome/totalExpenses si non fournis
      if (walletData.totalIncome !== undefined) upd.totalIncome = walletData.totalIncome;
      if (walletData.totalExpenses !== undefined) upd.totalExpenses = walletData.totalExpenses;
      // si amount modifié manuellement, ajuste totalIncome pour garder cohérence si besoin
      if (walletData.amount !== undefined && walletData.totalIncome === undefined && walletData.totalExpenses === undefined) {
        // on laisse totalIncome tel quel, seul amount change (correction solde)
      }
      // IDOR fix: toujours filtrer par uid propriétaire
      const { data, error } = await supabase
        .from("wallets")
        .update(upd)
        .eq("id", walletData.id)
        .eq("uid", finalUid)
        .select()
        .single();
      if (error) {
        if (error.message?.includes("currency")) {
          delete upd.currency;
          const retry = await supabase.from("wallets").update(upd).eq("id", walletData.id).eq("uid", finalUid).select().single();
          if (!retry.error) return { success: true, data: { ...retry.data, currency: (walletData as any).currency, id: retry.data.id } };
        }
        if (isNetworkError(error.message)) {
          const local = { id: walletData.id, uid: finalUid, name: walletData.name, image: typeof imageUrl === "string" ? imageUrl : null, amount: walletData.amount, totalIncome: walletData.totalIncome, totalExpenses: walletData.totalExpenses, currency: (walletData as any).currency, created_at: new Date().toISOString(), _offline: true };
          await cacheWalletLocal(local, finalUid);
          return { success: true, data: local };
        }
        return { success: false, msg: humanizeError(error.message) };
      }
      return { success: true, data: { ...data, id: data.id } };
    }
  } catch (error: any) {
    if (isNetworkError(error.message)) {
      const uid2 = (walletData as any).uid || "offline";
      const local = { id: walletData.id || `local-${Date.now()}`, uid: uid2, name: walletData.name, image: typeof (walletData as any).image === "string" ? (walletData as any).image : null, amount: Number(walletData.amount || 0), totalIncome: Number(walletData.amount || 0) > 0 ? Number(walletData.amount) : 0, totalExpenses: 0, currency: (walletData as any).currency || "XOF", created_at: new Date().toISOString(), _offline: true };
      try { await cacheWalletLocal(local, uid2); } catch {}
      return { success: true, data: local };
    }
    return { success: false, msg: humanizeError(error.message || "Could not create or update wallet") };
  }
};

export const deleteWallet = async (walletId: string): Promise<ResponseType> => {
  const isLocalId = walletId?.startsWith("local-");
  const cleanLocalCache = async () => {
    try {
      // supprime des caches AsyncStorage (tous les uid)
      const keysToCheck = ["mock_wallets", "mock_transactions"];
      // parcourt aussi wallets_{uid}
      // on récupère toutes les clés et filtre
      const allKeys = await AsyncStorage.getAllKeys?.() ?? [];
      const walletKeys = allKeys.filter((k: string) => k.startsWith("wallets_") || k.startsWith("txs_"));
      const toClean = [...new Set([...keysToCheck, ...walletKeys])];
      for (const key of toClean) {
        try {
          const raw = await AsyncStorage.getItem(key);
          if (!raw) continue;
          const list = JSON.parse(raw);
          if (!Array.isArray(list)) continue;
          const filtered = list.filter((item: any) => item.id !== walletId && item.walletId !== walletId);
          if (filtered.length !== list.length) {
            await AsyncStorage.setItem(key, JSON.stringify(filtered));
          }
        } catch {}
      }
    } catch {}
  };

  try {
    // Si id local, pas besoin de Supabase
    if (isLocalId) {
      await cleanLocalCache();
      return { success: true, data: "Wallet deleted successfully" };
    }
    // supprime transactions liées d'abord
    try { await deleteTransactionByWalletId(walletId); } catch {}
    const { error } = await supabase.from("wallets").delete().eq("id", walletId);
    if (error) {
      if (isNetworkError(error.message)) {
        await cleanLocalCache();
        return { success: true, data: "Wallet deleted successfully (offline)" };
      }
      return { success: false, msg: humanizeError(error.message) };
    }
    await cleanLocalCache();
    return { success: true, data: "Wallet deleted successfully" };
  } catch (error: any) {
    if (isNetworkError(error?.message || "")) {
      await cleanLocalCache();
      return { success: true, data: "Wallet deleted successfully (offline)" };
    }
    return { success: false, msg: humanizeError(error.message) };
  }
};

export const deleteTransactionByWalletId = async (walletId: string): Promise<ResponseType> => {
  try {
    if (walletId?.startsWith("local-")) return { success: true, msg: "All transaction deleted" };
    const { error } = await supabase.from("transactions").delete().eq("walletId", walletId);
    if (error) {
      if (isNetworkError(error.message)) return { success: true, msg: "All transaction deleted (offline)" };
      return { success: false, msg: humanizeError(error.message) };
    }
    return { success: true, msg: "All transaction deleted" };
  } catch (error: any) {
    if (isNetworkError(error?.message || "")) return { success: true, msg: "All transaction deleted (offline)" };
    return { success: false, msg: humanizeError(error.message) };
  }
};

// Helper to fetch wallets for current user
export const fetchWallets = async (uid: string) => {
  const { data, error } = await supabase.from("wallets").select("*").eq("uid", uid).order("created_at", { ascending: false });
  if (error) return { success: false, msg: humanizeError(error.message) };
  return { success: true, data };
};
