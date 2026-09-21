import { ResponseType, WalletType } from "@/types";
import { supabase } from "@/config/supabase";
import { uploadFileToSupabase } from "./images-service";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isNetworkError = (msg: string) => /fetch|network|offline|Failed to fetch/i.test(msg || "");
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

    if (!walletData.id) {
      const { data, error } = await supabase
        .from("wallets")
        .insert({
          uid: finalUid,
          name: walletData.name,
          image: typeof imageUrl === "string" ? imageUrl : null,
          amount: 0,
          totalIncome: 0,
          totalExpenses: 0,
        })
        .select()
        .single();
      if (error) {
        if (isNetworkError(error.message)) {
          const local = { id: `local-${Date.now()}`, uid: finalUid, name: walletData.name, image: typeof imageUrl === "string" ? imageUrl : null, amount: 0, totalIncome: 0, totalExpenses: 0, created_at: new Date().toISOString(), _offline: true };
          await cacheWalletLocal(local, finalUid);
          return { success: true, data: local };
        }
        return { success: false, msg: error.message };
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
      const { data, error } = await supabase
        .from("wallets")
        .update({ name: walletData.name, image: imageUrl, amount: walletData.amount, totalIncome: walletData.totalIncome, totalExpenses: walletData.totalExpenses })
        .eq("id", walletData.id)
        .select()
        .single();
      if (error) {
        if (isNetworkError(error.message)) {
          const local = { id: walletData.id, uid: finalUid, name: walletData.name, image: typeof imageUrl === "string" ? imageUrl : null, amount: walletData.amount, totalIncome: walletData.totalIncome, totalExpenses: walletData.totalExpenses, created_at: new Date().toISOString(), _offline: true };
          await cacheWalletLocal(local, finalUid);
          return { success: true, data: local };
        }
        return { success: false, msg: error.message };
      }
      return { success: true, data: { ...data, id: data.id } };
    }
  } catch (error: any) {
    if (isNetworkError(error.message)) {
      const uid2 = (walletData as any).uid || "offline";
      const local = { id: walletData.id || `local-${Date.now()}`, uid: uid2, name: walletData.name, image: typeof (walletData as any).image === "string" ? (walletData as any).image : null, amount: 0, totalIncome: 0, totalExpenses: 0, created_at: new Date().toISOString(), _offline: true };
      try { await cacheWalletLocal(local, uid2); } catch {}
      return { success: true, data: local };
    }
    return { success: false, msg: error.message || "Could not create or update wallet" };
  }
};

export const deleteWallet = async (walletId: string): Promise<ResponseType> => {
  try {
    // Delete related transactions first (FK cascade would also handle, but explicit)
    await deleteTransactionByWalletId(walletId);
    const { error } = await supabase.from("wallets").delete().eq("id", walletId);
    if (error) return { success: false, msg: error.message };
    return { success: true, data: "Wallet deleted successfully" };
  } catch (error: any) {
    return { success: false, msg: error.message };
  }
};

export const deleteTransactionByWalletId = async (walletId: string): Promise<ResponseType> => {
  try {
    const { error } = await supabase.from("transactions").delete().eq("walletId", walletId);
    if (error) return { success: false, msg: error.message };
    return { success: true, msg: "All transaction deleted" };
  } catch (error: any) {
    return { success: false, msg: error.message };
  }
};

// Helper to fetch wallets for current user
export const fetchWallets = async (uid: string) => {
  const { data, error } = await supabase.from("wallets").select("*").eq("uid", uid).order("created_at", { ascending: false });
  if (error) return { success: false, msg: error.message };
  return { success: true, data };
};
