import { colors, spacingX, spacingY } from "@/constants/theme"
import { useAuth } from "@/context/auth-context"
import { useLocale } from "@/context/locale-context"
import { useSupabaseWallets } from "@/hooks/use-supabase-data"
import { WalletType } from "@/types"
import { scale, verticalScale } from "@/utils/styling"
import { router, useFocusEffect } from "expo-router"
import * as Icons from "phosphor-react-native"
import React, { useCallback } from "react"
import {
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"
import Typo from "./typo"
import { getCurrencyInfo } from "@/constants/currencies"
import { formatCurrency } from "@/utils/common"
import { fetchCurrencies } from "@/services/currency-service"
import AsyncStorage from "@react-native-async-storage/async-storage"

const HomeCard = () => {
  const { user } = useAuth()
  const { t } = useLocale()

  const {
    data: wallets,
    error,
    loading: walletLoading,
    refetch: refetchWallets,
  } = useSupabaseWallets(user?.uid)

  useFocusEffect(
    useCallback(() => {
      refetchWallets(false)
      AsyncStorage.getItem("display_currency").then(v => { if (v) setDisplayCurrency(v); })
    }, [refetchWallets])
  )

  // Calculate total balance + devise dominante
  const getTotalBalance = () => {
    return wallets.reduce(
      (totals: any, item: WalletType) => {
        totals.balance = totals.balance + Number(item.amount)
        totals.income = totals.income + Number(item.totalIncome)
        totals.expenses = totals.expenses + Number(item.totalExpenses)
        return totals
      },
      { balance: 0, income: 0, expenses: 0 },
    )
  }
  const dominantCurrency = (() => {
    if (!wallets.length) return "XOF";
    const counts: Record<string, number> = {};
    wallets.forEach((w: any) => { 
      const c = (w.currency || "XOF").toUpperCase().trim();
      const norm = c === "FCFA" || c === "F CFA" || c === "CFA" ? "XOF" : c;
      counts[norm] = (counts[norm] || 0) + 1; 
    });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
  })();
  const [displayCurrency, setDisplayCurrency] = React.useState<string>(dominantCurrency);
  const [rates, setRates] = React.useState<Record<string, number>>({});
  // charge devise d'affichage fixée en Settings
  React.useEffect(() => {
    AsyncStorage.getItem("display_currency").then(v => { if (v) setDisplayCurrency(v); });
  }, []);
  React.useEffect(() => {
    AsyncStorage.setItem("display_currency", displayCurrency).catch(() => {});
  }, [displayCurrency]);
  React.useEffect(() => {
    // si pas de pref utilisateur, suit la dominante
    AsyncStorage.getItem("display_currency").then(v => { if (!v) setDisplayCurrency(dominantCurrency); });
  }, [dominantCurrency]);
  React.useEffect(() => {
    if (!wallets.length) return;
    const uniq = Array.from(new Set(wallets.map((w:any)=>(w.currency||"XOF"))));
    const needConvert = uniq.length > 1 || uniq[0] !== displayCurrency;
    if (!needConvert) { setRates({}); return; }
    fetchCurrencies(displayCurrency).then(list => {
      const m: Record<string, number> = {};
      list.forEach(c => { m[c.code] = c.value; });
      m[displayCurrency] = 1;
      setRates(m);
    }).catch(() => setRates({}));
  }, [displayCurrency, wallets]);

  const convert = (amount: number, fromCur: string) => {
    const from = (fromCur || "XOF").toUpperCase();
    const norm = from === "FCFA" ? "XOF" : from;
    if (norm === displayCurrency) return amount;
    const rate = rates[norm];
    if (!rate) return amount; // fallback brut sans conversion si taux manquant
    // rates = 1 displayCurrency = rate * fromCurrency
    return amount / rate;
  };
  const getConvertedTotals = () => {
    return wallets.reduce(
      (t: any, w: any) => {
        const cur = w.currency || "XOF";
        t.balance += convert(Number(w.amount), cur);
        t.income += convert(Number(w.totalIncome), cur);
        t.expenses += convert(Number(w.totalExpenses), cur);
        return t;
      },
      { balance: 0, income: 0, expenses: 0 }
    );
  };
  const dominantInfo = getCurrencyInfo(displayCurrency);
  return (
    <ImageBackground
      source={require("@/public/images/card.png")}
      resizeMode="stretch"
      style={styles.bgImage}
    >
      <View style={styles.container}>
        <View>
          {/* //total balance section */}
          <View style={styles.totalBalanceRow}>
            <Typo size={17} color={colors.neutral800} fontWeight={"500"}>
              {t("totalBalance")}
            </Typo>
            <TouchableOpacity onPress={() => router.push("/(tabs)/more")}>
              <Icons.DotsThreeOutline
                size={verticalScale(23)}
                color={colors.black}
                weight="fill"
              />
            </TouchableOpacity>
          </View>
          <Typo size={26} color={colors.black} fontWeight={"bold"} textProps={{ numberOfLines: 1, adjustsFontSizeToFit: true } as any}>
            {walletLoading ? "----" : (() => { 
              const tot = wallets.length > 1 && Object.keys(rates).length ? getConvertedTotals().balance : getTotalBalance().balance;
              try { return formatCurrency(tot || 0, "fr-FR", displayCurrency, 0); } catch { return `${dominantInfo?.symbol || displayCurrency} ${Number(tot || 0).toLocaleString("fr-FR")}`; } 
            })()}
          </Typo>
          {/* Sélecteur devise total + détail par devise */}
          {!walletLoading && wallets.length > 0 && (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                <Typo size={11} color={colors.neutral600}>
                  {wallets.length > 1 && new Set(wallets.map((w:any)=>w.currency||"XOF")).size > 1 ? `Converti en ${displayCurrency}` : `En ${displayCurrency}`}
                </Typo>
                <TouchableOpacity onPress={() => {
                  const uniq = Array.from(new Set(wallets.map((w:any)=>(w.currency||"XOF").toUpperCase())));
                  const idx = uniq.indexOf(displayCurrency);
                  const next = uniq[(idx+1)%uniq.length] || uniq[0];
                  setDisplayCurrency(next);
                }} style={{ backgroundColor: "rgba(0,0,0,0.08)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Typo size={10} fontWeight="700" color={colors.black}>{displayCurrency} {dominantInfo?.symbol || ""}</Typo>
                  <Icons.CaretDown size={10} color={colors.black} weight="bold" />
                </TouchableOpacity>
              </View>
              {wallets.length > 1 && new Set(wallets.map((w:any)=>w.currency||"XOF")).size > 1 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {Array.from(new Set(wallets.map((w:any)=>w.currency||"XOF"))).map((cur: any) => {
                    const sum = wallets.filter((w:any)=>(w.currency||"XOF")===cur).reduce((s:any,w:any)=>s+Number(w.amount),0);
                    const info = getCurrencyInfo(cur);
                    return (
                      <View key={cur} style={{ backgroundColor: "rgba(0,0,0,0.07)", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 }}>
                        <Typo size={10} fontWeight="600" color={colors.black}>{info?.symbol || cur} {sum.toLocaleString("fr-FR")} {cur}</Typo>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </View>
        {/* //total income expense */}
        <View style={styles.stats}>
          {/* //total income */}
          <View style={{ gap: verticalScale(5) }}>
            <View style={styles.incomeExpense}>
              <View style={styles.statsIcon}>
                <Icons.ArrowDown
                  size={verticalScale(15)}
                  color={colors.black}
                  weight="bold"
                />
              </View>
              <Typo size={16} color={colors.neutral700} fontWeight={"500"}>
                {t("income")}
              </Typo>
            </View>
            <View style={{ alignSelf: "center" }}>
              <Typo size={14} color={colors.green} fontWeight={"600"} textProps={{ numberOfLines: 1 } as any}>
                {walletLoading ? "----" : (() => { 
                  const tot = wallets.length > 1 && Object.keys(rates).length ? getConvertedTotals().income : getTotalBalance().income;
                  try { return formatCurrency(tot || 0, "fr-FR", displayCurrency, 0); } catch { return `${dominantInfo?.symbol || ""} ${Number(tot||0).toLocaleString("fr-FR")}`; } 
                })()}
              </Typo>
            </View>
          </View>
          {/* //total expenses  */}
          <View style={{ gap: verticalScale(5) }}>
            <View style={styles.incomeExpense}>
              <View style={styles.statsIcon}>
                <Icons.ArrowUp
                  size={verticalScale(15)}
                  color={colors.black}
                  weight="bold"
                />
              </View>
              <Typo size={16} color={colors.neutral700} fontWeight={"500"}>
                {t("expenses")}
              </Typo>
            </View>
            <View style={{ alignSelf: "center" }}>
              <Typo size={14} color={colors.rose} fontWeight={"600"} textProps={{ numberOfLines: 1 } as any}>
                {walletLoading ? "----" : (() => { 
                  const tot = wallets.length > 1 && Object.keys(rates).length ? getConvertedTotals().expenses : getTotalBalance().expenses;
                  try { return formatCurrency(tot || 0, "fr-FR", displayCurrency, 0); } catch { return `${dominantInfo?.symbol || ""} ${Number(tot||0).toLocaleString("fr-FR")}`; } 
                })()}
              </Typo>
            </View>
          </View>
          {/* end //total expenses  */}
        </View>
      </View>
    </ImageBackground>
  )
}

export default HomeCard

const styles = StyleSheet.create({
  bgImage: {
    height: scale(210),
    width: "100%",
  },
  container: {
    padding: spacingX._20,
    paddingHorizontal: scale(23),
    height: "87%",
    width: "100%",
    justifyContent: "space-between",
  },
  totalBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingX._5,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsIcon: {
    backgroundColor: colors.neutral350,
    padding: spacingY._5,
    borderRadius: 50,
  },
  incomeExpense: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingY._7,
  },
})
