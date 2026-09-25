import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import React, { useCallback } from "react";
import ScreenWrapper from "@/components/screen-wrapper";
import Typo from "@/components/typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import * as Icons from "phosphor-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSupabaseWallets } from "@/hooks/use-supabase-data";
import WalletListItem from "@/components/wallet-list-item";
import Loading from "@/components/loading";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { formatCurrency } from "@/utils/common";
import { getCurrencyInfo } from "@/constants/currencies";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Wallet() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLocale();

  const {
    data: wallets,
    loading,
    error,
    refetch,
  } = useSupabaseWallets(user?.uid);

  // Rafraîchir immédiatement quand on revient sur cet écran (après création modal)
  useFocusEffect(
    useCallback(() => {
      refetch(true);
    }, [refetch])
  );

  // Devise d'affichage (même logique que home-card)
  const dominantCurrency = (() => {
    if (!wallets.length) return "XOF";
    const counts: Record<string, number> = {};
    wallets.forEach((w: any) => {
      const c = (w.currency || "XOF").toUpperCase().trim();
      const norm = c === "FCFA" || c === "F CFA" || c === "CFA" ? "XOF" : c;
      counts[norm] = (counts[norm] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  })();
  const [displayCurrency, setDisplayCurrency] = React.useState<string>(dominantCurrency);

  React.useEffect(() => {
    AsyncStorage.getItem("display_currency").then(v => { if (v) setDisplayCurrency(v); });
  }, []);

  React.useEffect(() => {
    AsyncStorage.getItem("display_currency").then(v => { if (!v) setDisplayCurrency(dominantCurrency); });
  }, [dominantCurrency]);

  // Fetch total balance from API
  const getTotalBalance = () =>
    wallets.reduce((total, item) => {
      total += (item.amount || 0);
      return total;
    }, 0);

  const dominantInfo = getCurrencyInfo(displayCurrency);

  return (
    <ScreenWrapper style={{ backgroundColor: colors.black }}>
      <View style={styles.container}>
        {/* Balance View container */}
        <View style={styles.balanceView}>
          <View style={{ alignItems: "center" }}>
            <Typo size={32} fontWeight={"600"}>
              {(() => {
                const total = getTotalBalance();
                try {
                  return formatCurrency(total, "fr-FR", displayCurrency, 2);
                } catch {
                  return `${dominantInfo?.symbol || displayCurrency} ${total.toFixed(2)}`;
                }
              })()}
            </Typo>
            <Typo size={16} color={colors.neutral350}>
              {t("totalBalance")}
            </Typo>
          </View>
        </View>
        {/* Wallet container */}
        <View style={styles.wallet}>
          <View style={styles.flexRow}>
            <Typo size={20} fontWeight={"500"}>
              {t("myWallets")}
            </Typo>
            <TouchableOpacity
              onPress={() => router.push("/(modals)/wallet-modal")}
            >
              <Icons.PlusCircle
                weight="fill"
                color={colors.white}
                size={verticalScale(33)}
              />
            </TouchableOpacity>
          </View>

          {/* Wallet list section  */}
          {loading && <Loading />}
          {error && (
            <Typo size={16} color={colors.primary}>
              {error}
            </Typo>
          )}

          <FlatList
            data={wallets}
            renderItem={({ item, index }) => {
              return (
                <WalletListItem item={item} index={index} router={router} />
              );
            }}
            contentContainerStyle={styles.listStyle}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    color: colors.textLight,
  },
  balanceView: {
    height: verticalScale(160),
    backgroundColor: colors.black,
    justifyContent: "center",
    alignItems: "center",
  },
  flexRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._10,
  },
  wallet: {
    flex: 1,
    backgroundColor: colors.neutral900,
    borderTopRightRadius: radius._30,
    borderTopLeftRadius: radius._30,
    padding: spacingX._20,
    paddingTop: spacingX._25,
  },
  listStyle: {
    paddingVertical: spacingY._15,
    paddingTop: spacingY._15,
  },
});
