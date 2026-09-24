import BackButton from "@/components/back-button"
import Header from "@/components/header"
import ModalWrapper from "@/components/modal-wrapper"
import Typo from "@/components/typo"
import { colors, radius, spacingX, spacingY } from "@/constants/theme"
import { OptionType } from "@/types"
import { verticalScale } from "@/utils/styling"
import * as Icons from "phosphor-react-native"
import React, { useEffect, useState } from "react"
import { Alert, StyleSheet, Switch, TouchableOpacity, View } from "react-native"
import { useRouter } from "expo-router"
import Animated, { FadeInDown } from "react-native-reanimated"
import { useLocale } from "@/context/locale-context"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/config/supabase"
import AsyncStorage from "@react-native-async-storage/async-storage"
import ConfirmDialog from "@/components/confirm-dialog"
import { useToast } from "@/context/toast-context"
import { WORLD_CURRENCIES } from "@/constants/currencies"
import { Dropdown } from "react-native-element-dropdown"

const SettingsModal = () => {
  const { t, language, setLanguage } = useLocale()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const isFR = language === "fr"
  const [confirm, setConfirm] = useState<"data" | "account" | null>(null)
  const [loading, setLoading] = useState(false)
  const [displayCurrency, setDisplayCurrency] = useState("XOF")
  useEffect(() => { AsyncStorage.getItem("display_currency").then(v => { if (v) setDisplayCurrency(v); }); }, [])
  const handleDisplayCurrencyChange = async (code: string) => {
    setDisplayCurrency(code)
    await AsyncStorage.setItem("display_currency", code)
  }

  const handleNotificationPress = () => {
    router.push("/(modals)/notifications-modal" as any);
  };

  const handleClearData = async () => {
    setLoading(true)
    try {
      const uid = user?.uid
      if (uid) {
        // supprime côté Supabase
        try { await supabase.from("transactions").delete().eq("uid", uid) } catch {}
        try { await supabase.from("wallets").delete().eq("uid", uid) } catch {}
      }
      // purge cache local sauf compte
      const keys = await AsyncStorage.getAllKeys()
      const toRemove = keys.filter(k => k.startsWith("wallets_") || k.startsWith("txs_") || k.startsWith("mock_") || k.startsWith("pending_") || k.startsWith("cached_") || k.startsWith("seen_"))
      if (toRemove.length) await AsyncStorage.multiRemove(toRemove)
      showToast("success", "Données effacées", "Portefeuilles et transactions supprimés ✓")
      setConfirm(null)
    } catch (e: any) {
      Alert.alert("Erreur", e.message)
    } finally { setLoading(false) }
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    try {
      const uid = user?.uid
      if (uid) {
        try { await supabase.from("transactions").delete().eq("uid", uid) } catch {}
        try { await supabase.from("wallets").delete().eq("uid", uid) } catch {}
        try { await supabase.from("profiles").delete().eq("id", uid) } catch {}
      }
      // purge tout y compris compte offline
      const keys = await AsyncStorage.getAllKeys()
      const toRemove = keys.filter(k => k !== "app_locale" && k !== "app_theme")
      if (toRemove.length) await AsyncStorage.multiRemove(toRemove)
      await logout()
      showToast("success", "Compte supprimé", "Toutes les données et le compte ont été supprimés")
      setConfirm(null)
      setTimeout(() => router.replace("/(auth)/welcome" as any), 600)
    } catch (e: any) {
      Alert.alert("Erreur", e.message)
    } finally { setLoading(false) }
  }

  const settings: OptionType[] = [
    {
      title: t("notification"),
      icon: <Icons.Bell size={26} color={colors.white} weight="fill" />,
      type: "arrow",
      bgColor: "#8b5cf6",
      onPress: handleNotificationPress,
    },
    {
      title: "Français",
      icon: <Icons.Translate size={26} color={colors.white} weight="fill" />,
      type: "switch",
      value: isFR,
      onChange: (value: boolean) => setLanguage(value ? "fr" : "en"),
      bgColor: "#ec4899",
    },
    {
      title: "English",
      icon: <Icons.Translate size={26} color={colors.white} weight="fill" />,
      type: "switch",
      value: !isFR,
      onChange: (value: boolean) => setLanguage(value ? "en" : "fr"),
      bgColor: "#0ea5e9",
    },
    {
      title: t("version"),
      icon: <Icons.Info size={26} color={colors.white} weight="fill" />,
      type: "text",
      value: "1.0.0",
      bgColor: "#6366f1",
    },
  ]

  const renderRightComponent = (item: OptionType) => {
    switch (item.type) {
      case "switch":
        return (
          <Switch
            value={item.value as boolean}
            onValueChange={item.onChange}
            trackColor={{ false: colors.neutral600, true: colors.primary }}
            thumbColor={colors.white}
          />
        )
      case "arrow":
        return (
          <Icons.CaretRight
            size={verticalScale(20)}
            weight="bold"
            color={colors.white}
          />
        )
      case "text":
        return (
          <Typo size={14} color={colors.neutral400}>
            {item.value}
          </Typo>
        )
      default:
        return null
    }
  }

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={t("settings")}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        <View style={styles.cardContainer}>
          <View style={styles.settingsSection}>
            {settings.map((item, index) => (
              <Animated.View
                key={index.toString()}
                entering={FadeInDown.delay(index * 50)
                  .springify()
                  .damping(50)}
              >
                {index > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  onPress={item.onPress}
                  style={styles.settingItem}
                  disabled={item.type === "switch" || item.type === "text"}
                >
                  <View
                    style={[styles.listIcon, { backgroundColor: item.bgColor }]}
                  >
                    {item.icon}
                  </View>
                  <Typo size={16} style={{ flex: 1 }} fontWeight="500">
                    {item.title}
                  </Typo>
                  {renderRightComponent(item)}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Affichage */}
        <View style={[styles.cardContainer, { marginTop: 16 }]}>
          <View style={{ padding: 12, gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icons.Eye size={16} color={colors.primary} weight="fill" />
              <Typo size={13} fontWeight="700" color={colors.white}>Affichage</Typo>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={[styles.listIcon, { backgroundColor: "#0ea5e9", width: 36, height: 36 }]}>
                  <Icons.CurrencyDollar size={18} color="#fff" weight="fill" />
                </View>
                <Typo size={14} fontWeight="600" color={colors.white}>Devise d'affichage</Typo>
              </View>
              <Dropdown
                style={{ minWidth: 110, height: 36, backgroundColor: colors.neutral700, borderRadius: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}
                containerStyle={{ backgroundColor: colors.neutral800, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}
                selectedTextStyle={{ color: colors.white, fontSize: 13, fontWeight: "600" }}
                itemTextStyle={{ color: colors.white, fontSize: 12 }}
                activeColor={colors.neutral700}
                data={WORLD_CURRENCIES.slice(0, 20).map(c => ({ label: `${c.code} ${c.symbol}`, value: c.code }))}
                labelField="label"
                valueField="value"
                value={displayCurrency}
                onChange={item => handleDisplayCurrencyChange(item.value)}
                maxHeight={260}
              />
            </View>
            <Typo size={11} color={colors.neutral500}>Total Balance converti en temps réel dans cette devise</Typo>
          </View>
        </View>

        {/* Zone danger */}
        <View style={[styles.cardContainer, { marginTop: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.25)" }]}>
          <View style={{ padding: 12, gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icons.Warning size={16} color={colors.rose} weight="fill" />
              <Typo size={13} fontWeight="700" color={colors.rose}>Zone dangereuse</Typo>
            </View>
            <TouchableOpacity onPress={() => setConfirm("data")} style={styles.dangerRow} activeOpacity={0.7}>
              <View style={[styles.listIcon, { backgroundColor: "#f97316", width: 36, height: 36 }]}>
                <Icons.Broom size={18} color="#fff" weight="fill" />
              </View>
              <View style={{ flex: 1 }}>
                <Typo size={14} fontWeight="600" color={colors.white}>Effacer toutes mes données</Typo>
                <Typo size={11} color={colors.neutral400}>Garde le compte, supprime wallets & transactions</Typo>
              </View>
              <Icons.CaretRight size={16} color={colors.neutral500} weight="bold" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity onPress={() => setConfirm("account")} style={styles.dangerRow} activeOpacity={0.7}>
              <View style={[styles.listIcon, { backgroundColor: colors.rose, width: 36, height: 36 }]}>
                <Icons.Trash size={18} color="#fff" weight="fill" />
              </View>
              <View style={{ flex: 1 }}>
                <Typo size={14} fontWeight="600" color={colors.white}>Supprimer le compte</Typo>
                <Typo size={11} color={colors.neutral400}>Efface tout + déconnecte définitivement</Typo>
              </View>
              <Icons.CaretRight size={16} color={colors.neutral500} weight="bold" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ConfirmDialog
        visible={confirm === "data"}
        title="Effacer les données ?"
        message="Tous les portefeuilles et transactions seront supprimés. Ton compte sera conservé."
        confirmLabel="Effacer"
        cancelLabel="Annuler"
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={handleClearData}
      />
      <ConfirmDialog
        visible={confirm === "account"}
        title="Supprimer le compte ?"
        message="Toutes les données et ton compte seront supprimés. Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={handleDeleteAccount}
      />
    </ModalWrapper>
  )
}

export default SettingsModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  cardContainer: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._15,
  },
  settingsSection: {
    gap: 0,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
    paddingVertical: spacingY._12,
  },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
    paddingVertical: spacingY._10,
  },
  listIcon: {
    height: verticalScale(44),
    width: verticalScale(44),
    backgroundColor: colors.neutral500,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius._15,
    borderCurve: "continuous",
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral700,
  },
})
