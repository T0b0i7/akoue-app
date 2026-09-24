import { colors, spacingX, spacingY } from "@/constants/theme"
import { useAuth } from "@/context/auth-context"
import { useLocale } from "@/context/locale-context"
import { useSupabaseWallets } from "@/hooks/use-supabase-data"
import { WalletType } from "@/types"
import { scale, verticalScale } from "@/utils/styling"
import { router } from "expo-router"
import * as Icons from "phosphor-react-native"
import React from "react"
import {
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"
import Typo from "./typo"
import { getCurrencyInfo } from "@/constants/currencies"
import { formatCurrency } from "@/utils/common"

const HomeCard = () => {
  const { user } = useAuth()
  const { t } = useLocale()

  const {
    data: wallets,
    error,
    loading: walletLoading,
  } = useSupabaseWallets(user?.uid)

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
    wallets.forEach((w: any) => { const c = w.currency || "XOF"; counts[c] = (counts[c] || 0) + 1; });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
  })();
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
            {walletLoading ? "----" : (() => { try { return formatCurrency(getTotalBalance()?.balance || 0, "fr-FR", dominantCurrency, 0); } catch { return `${getCurrencyInfo(dominantCurrency)?.symbol || dominantCurrency} ${Number(getTotalBalance()?.balance || 0).toLocaleString("fr-FR")}`; } })()}
          </Typo>
          {wallets.length > 1 && new Set(wallets.map((w:any)=>w.currency||"XOF")).size > 1 && (
            <Typo size={11} color={colors.neutral600}>Devises mixtes • affiché en {dominantCurrency}</Typo>
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
                {walletLoading ? "----" : (() => { try { return formatCurrency(getTotalBalance()?.income || 0, "fr-FR", dominantCurrency, 0); } catch { return `${getCurrencyInfo(dominantCurrency)?.symbol || ""} ${Number(getTotalBalance()?.income||0).toLocaleString("fr-FR")}`; } })()}
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
                {walletLoading ? "----" : (() => { try { return formatCurrency(getTotalBalance()?.expenses || 0, "fr-FR", dominantCurrency, 0); } catch { return `${getCurrencyInfo(dominantCurrency)?.symbol || ""} ${Number(getTotalBalance()?.expenses||0).toLocaleString("fr-FR")}`; } })()}
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
