import { supabase } from "@/config/supabase";
import { TransactionType, ResponseType, WalletType } from "@/types";
import { uploadFileToSupabase } from "./images-service";
import { createOrUpdateWallet } from "./wallet-service";
import { getLast12Months, getLast7Days, getYearsRange } from "@/utils/common";
import { scale } from "@/utils/styling";
import { colors } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isNetErr = (m: string) => /fetch|network|offline|Failed to fetch/i.test(m || "");
async function cacheTxLocal(tx: any, uid: string) {
  try {
    const key = `txs_${uid}`;
    const raw = await AsyncStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(tx);
    await AsyncStorage.setItem(key, JSON.stringify(list));
    await AsyncStorage.setItem("mock_transactions", JSON.stringify(list));
    const qRaw = await AsyncStorage.getItem("pending_txs");
    const q = qRaw ? JSON.parse(qRaw) : [];
    q.push(tx);
    await AsyncStorage.setItem("pending_txs", JSON.stringify(q));
    // update wallet cache
    const wKey = `wallets_${uid}`;
    const wRaw = await AsyncStorage.getItem(wKey);
    if (wRaw) {
      const wallets = JSON.parse(wRaw);
      const idx = wallets.findIndex((w: any) => w.id === tx.walletId);
      if (idx >= 0) {
        const w = wallets[idx];
        const delta = tx.type === "income" ? tx.amount : -tx.amount;
        w.amount = Number(w.amount) + delta;
        if (tx.type === "income") w.totalIncome = Number(w.totalIncome) + tx.amount;
        else w.totalExpenses = Number(w.totalExpenses) + tx.amount;
        await AsyncStorage.setItem(wKey, JSON.stringify(wallets));
        await AsyncStorage.setItem("mock_wallets", JSON.stringify(wallets));
      }
    }
  } catch {}
}

export const createOrUpdateTransaction = async (
  transactionData: Partial<TransactionType>
): Promise<ResponseType> => {
  try {
    const { id, type, walletId, amount, image } = transactionData;
    if (!amount || amount <= 0 || !walletId || !type) {
      return { success: false, msg: "Invalid transaction data!" };
    }

    const { data: { user } } = await supabase.auth.getUser();
    const uid = (transactionData as any).uid || user?.id;
    if (!uid) return { success: false, msg: "User not authenticated" };

    if (id) {
      const { data: oldTx, error: fetchErr } = await supabase.from("transactions").select("*").eq("id", id).single();
      if (fetchErr || !oldTx) return { success: false, msg: "Transaction not found" };

      const shouldRevert =
        (oldTx as any).type !== type ||
        Number((oldTx as any).amount) !== Number(amount) ||
        (oldTx as any).walletId !== walletId;

      if (shouldRevert) {
        const res = await revertAndUpdateWallets(oldTx as TransactionType, Number(amount), type, walletId);
        if (!res.success) return res;
      }
    } else {
      const res = await updateWalletforNewTransaction(walletId!, Number(amount!), type);
      if (!res.success) return res;
    }

    let imageUrl: any = transactionData.image;
    if (image && (image as any)?.uri) {
      const up = await uploadFileToSupabase(image as any, "transactions");
      if (!up.success) return { success: false, msg: up.msg || "Failed to upload transaction image" };
      imageUrl = up.data;
    }

    const payload: any = {
      uid,
      walletId,
      type,
      amount: Number(amount),
      category: (transactionData as any).category,
      description: (transactionData as any).description,
      image: imageUrl,
      date: transactionData.date ? new Date(transactionData.date as any).toISOString() : new Date().toISOString(),
    };

    if (id) {
      const { data, error } = await supabase.from("transactions").update(payload).eq("id", id).select().single();
      if (error) return { success: false, msg: error.message };
      return { success: true, data: { ...data, id: data.id } };
    } else {
      const { data, error } = await supabase.from("transactions").insert(payload).select().single();
      if (error) return { success: false, msg: error.message };
      return { success: true, data: { ...data, id: data.id } };
    }
  } catch (error: any) {
    if (isNetErr(error.message)) {
      const uid2 = (transactionData as any).uid || "offline";
      const localTx = {
        id: `local-${Date.now()}`,
        uid: uid2,
        walletId: transactionData.walletId,
        type: transactionData.type,
        amount: Number(transactionData.amount),
        category: (transactionData as any).category,
        description: (transactionData as any).description,
        image: null,
        date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        _offline: true,
      };
      await cacheTxLocal(localTx, uid2);
      return { success: true, data: localTx };
    }
    return { success: false, msg: error.message };
  }
};

const updateWalletforNewTransaction = async (walletId: string, amount: number, type: string) => {
  try {
    const { data: wallet, error } = await supabase.from("wallets").select("*").eq("id", walletId).single();
    if (error || !wallet) return { success: false, msg: "Wallet not found" };
    if (type === "expense" && Number(wallet.amount) - amount < 0) {
      return { success: false, msg: "Insufficient balance for your wallet" };
    }
    const updatedType = type === "income" ? "totalIncome" : "totalExpenses";
    const newAmount = type === "income" ? Number(wallet.amount) + amount : Number(wallet.amount) - amount;
    const newTotal = Number((wallet as any)[updatedType]) + amount;
    const { error: updErr } = await supabase.from("wallets").update({ amount: newAmount, [updatedType]: newTotal }).eq("id", walletId);
    if (updErr) return { success: false, msg: updErr.message };
    return { success: true };
  } catch (error: any) {
    return { success: false, msg: error.message };
  }
};

const revertAndUpdateWallets = async (
  oldTransaction: TransactionType,
  newAmount: number,
  newType: string,
  newWalletId: string
) => {
  try {
    const { data: originalWallet } = await supabase.from("wallets").select("*").eq("id", oldTransaction.walletId).single();
    const { data: newWallet } = await supabase.from("wallets").select("*").eq("id", newWalletId).single();
    if (!originalWallet || !newWallet) return { success: false, msg: "Wallet not found" };

    const revertType = oldTransaction.type === "income" ? "totalIncome" : "totalExpenses";
    const revertDelta = oldTransaction.type === "income" ? -Number(oldTransaction.amount) : Number(oldTransaction.amount);
    const revertedAmount = Number(originalWallet.amount) + revertDelta;
    const revertedTotal = Number((originalWallet as any)[revertType]) - Number(oldTransaction.amount);

    if (newType === "expense") {
      if (oldTransaction.walletId === newWalletId && revertedAmount < newAmount) {
        return { success: false, msg: "The selected wallet don't have enough balance" };
      }
      if (Number(newWallet.amount) < newAmount && oldTransaction.walletId !== newWalletId) {
        // Check after revert if same wallet balance was already accounted — re-fetch
        const bal = oldTransaction.walletId === newWalletId ? revertedAmount : Number(newWallet.amount);
        if (bal < newAmount) return { success: false, msg: "The selected wallet don't have enough balance" };
      }
    }

    await supabase.from("wallets").update({ amount: revertedAmount, [revertType]: revertedTotal }).eq("id", oldTransaction.walletId);

    const { data: freshNewWallet } = await supabase.from("wallets").select("*").eq("id", newWalletId).single();
    const upType = newType === "income" ? "totalIncome" : "totalExpenses";
    const updatedDelta = newType === "income" ? Number(newAmount) : -Number(newAmount);
    const newWalletAmount = Number((freshNewWallet as any).amount) + updatedDelta;
    const newIncomeExpense = Number((freshNewWallet as any)[upType]) + Number(newAmount);

    const { error } = await supabase.from("wallets").update({ amount: newWalletAmount, [upType]: newIncomeExpense }).eq("id", newWalletId);
    if (error) return { success: false, msg: error.message };
    return { success: true };
  } catch (error: any) {
    return { success: false, msg: error.message };
  }
};

export const deleteTransaction = async (transactionId: string, walletId: string) => {
  try {
    const { data: tx } = await supabase.from("transactions").select("*").eq("id", transactionId).single();
    if (!tx) return { success: false, msg: "Transaction not found" };
    const { data: wallet } = await supabase.from("wallets").select("*").eq("id", walletId).single();
    if (!wallet) return { success: false, msg: "Wallet not found" };

    const updatedType = (tx as any).type === "income" ? "totalIncome" : "totalExpenses";
    const newWalletAmount = Number(wallet.amount) - ((tx as any).type === "income" ? Number((tx as any).amount) : -Number((tx as any).amount));
    const newTotal = Number((wallet as any)[updatedType]) - Number((tx as any).amount);

    if ((tx as any).type === "income" && newWalletAmount < 0) {
      return { success: false, msg: "The selected wallet don't have enough balance" };
    }

    await supabase.from("wallets").update({ amount: newWalletAmount, [updatedType]: newTotal }).eq("id", walletId);
    const { error } = await supabase.from("transactions").delete().eq("id", transactionId);
    if (error) return { success: false, msg: error.message };
    return { success: true };
  } catch (error: any) {
    return { success: false, msg: error.message };
  }
};

// Stats
const formatStats = (data: any[], labelKey: string) =>
  data.flatMap((item) => [
    { value: item.income, label: item[labelKey], spacing: scale(4), labelWidth: scale(30), frontColor: colors.primary },
    { value: item.expense, frontColor: colors.rose },
  ]);

export const fetchWeeklyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("uid", uid)
      .gte("date", sevenDaysAgo.toISOString())
      .lte("date", today.toISOString())
      .order("date", { ascending: true });
    if (error) {
      if (isNetErr(error.message)) {
        const raw = await AsyncStorage.getItem(`txs_${uid}`);
        const cached = raw ? JSON.parse(raw) : [];
        const filtered = cached.filter((t: any) => new Date(t.date) >= sevenDaysAgo && new Date(t.date) <= today);
        const weeklyData = getLast7Days();
        filtered.forEach((t: any) => {
          const d = new Date(t.date).toISOString().split("T")[0];
          const day = weeklyData.find((x) => x.date === d);
          if (day) { if (t.type === "income") day.income! += Number(t.amount); else day.expense! += Number(t.amount); }
        });
        return { success: true, data: { stats: formatStats(weeklyData, "day"), transactions: filtered } };
      }
      return { success: false, msg: error.message };
    }
    const weeklyData = getLast7Days();
    data?.forEach((t: any) => {
      const d = new Date(t.date).toISOString().split("T")[0];
      const day = weeklyData.find((x) => x.date === d);
      if (day) {
        if (t.type === "income") day.income! += Number(t.amount);
        else day.expense! += Number(t.amount);
      }
    });
    return { success: true, data: { stats: formatStats(weeklyData, "day"), transactions: data } };
  } catch (error: any) {
    if (isNetErr(error.message)) {
      const raw = await AsyncStorage.getItem(`txs_${uid}`);
      const cached = raw ? JSON.parse(raw) : [];
      return { success: true, data: { stats: [], transactions: cached } };
    }
    return { success: false, msg: error.message };
  }
};

export const fetchMonthlyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const today = new Date();
    const twelveAgo = new Date(today);
    twelveAgo.setMonth(today.getMonth() - 12);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("uid", uid)
      .gte("date", twelveAgo.toISOString())
      .lte("date", today.toISOString())
      .order("date", { ascending: true });
    if (error) {
      if (isNetErr(error.message)) {
        const raw = await AsyncStorage.getItem(`txs_${uid}`);
        const cached = raw ? JSON.parse(raw) : [];
        return { success: true, data: { stats: [], transactions: cached } };
      }
      return { success: false, msg: error.message };
    }
    const monthlyData = getLast12Months();
    data?.forEach((t: any) => {
      const d = new Date(t.date);
      const monthName = d.toLocaleDateString("default", { month: "short" });
      const shortYear = d.getFullYear().toString().slice(-2);
      const md = monthlyData.find((m) => m.month === `${monthName} ${shortYear}`);
      if (md) {
        if (t.type === "income") md.income! += Number(t.amount);
        else md.expense! += Number(t.amount);
      }
    });
    const stats = monthlyData.flatMap((month) => [
      { value: month.income, label: month.month, spacing: scale(4), labelWidth: scale(30), frontColor: colors.primary },
      { value: month.expense, frontColor: colors.rose },
    ]);
    return { success: true, data: { stats, transactions: data } };
  } catch (error: any) {
    return { success: false, msg: error.message };
  }
};

export const fetchYearlyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const { data, error } = await supabase.from("transactions").select("*").eq("uid", uid).order("date", { ascending: true });
    if (error) {
      if (isNetErr(error.message)) {
        const raw = await AsyncStorage.getItem(`txs_${uid}`);
        const cached = raw ? JSON.parse(raw) : [];
        return { success: true, data: { stats: [], transactions: cached } };
      }
      return { success: false, msg: error.message };
    }
    if (!data?.length) return { success: true, data: { stats: [], transactions: [] } };
    const firstYear = new Date(data[0].date).getFullYear();
    const yearlyData = getYearsRange(firstYear, new Date().getFullYear());
    data.forEach((t: any) => {
      const y = new Date(t.date).getFullYear().toString();
      const yd = yearlyData.find((x: any) => x.year === y);
      if (yd) {
        if (t.type === "income") yd.income! += Number(t.amount);
        else yd.expense! += Number(t.amount);
      }
    });
    const stats = yearlyData.flatMap((year: any) => [
      { value: year.income, label: year.year, spacing: scale(4), labelWidth: scale(35), frontColor: colors.primary },
      { value: year.expense, frontColor: colors.rose },
    ]);
    return { success: true, data: { stats, transactions: data } };
  } catch (error: any) {
    return { success: false, msg: error.message };
  }
};
