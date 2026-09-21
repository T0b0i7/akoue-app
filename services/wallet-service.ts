import { ResponseType, WalletType } from "@/types";
import { supabase } from "@/config/supabase";
import { uploadFileToSupabase } from "./images-service";

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
      if (error) return { success: false, msg: error.message };
      return { success: true, data: { ...data, id: data.id } };
    } else {
      const { data, error } = await supabase
        .from("wallets")
        .update({ name: walletData.name, image: imageUrl, amount: walletData.amount, totalIncome: walletData.totalIncome, totalExpenses: walletData.totalExpenses })
        .eq("id", walletData.id)
        .select()
        .single();
      if (error) return { success: false, msg: error.message };
      return { success: true, data: { ...data, id: data.id } };
    }
  } catch (error: any) {
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
