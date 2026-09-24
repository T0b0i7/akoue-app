import BackButton from "@/components/back-button"
import ButtonComponent from "@/components/button"
import HeaderComponent from "@/components/header"
import ImageUpload from "@/components/image-upload"
import IconPicker from "@/components/icon-picker"
import ModalWrapper from "@/components/modal-wrapper"
import TextInputComponent from "@/components/text-input"
import Typo from "@/components/typo"
import { colors, radius, spacingX, spacingY } from "@/constants/theme"
import { WALLET_ICONS, toIconString, parseIconString } from "@/constants/wallet-icons"
import { WORLD_CURRENCIES, DEFAULT_CURRENCY } from "@/constants/currencies"
import { useAuth } from "@/context/auth-context"
import { useLocale } from "@/context/locale-context"
import { createOrUpdateWallet, deleteWallet } from "@/services/wallet-service"
import { WalletType } from "@/types"
import { scale, verticalScale } from "@/utils/styling"
import { useLocalSearchParams, useRouter } from "expo-router"
import * as Icons from "phosphor-react-native"
import React, { useEffect, useState } from "react"
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native"
import { Dropdown } from "react-native-element-dropdown"
import { getNumberInput, formatNumberInput } from "@/utils/common"

const WalletModal = () => {
  const { user } = useAuth()
  const { t } = useLocale()
  const [wallet, setWalletData] = useState<WalletType>({
    name: "",
    image: null,
  })
  const [iconId, setIconId] = useState("wallet")
  const [iconColor, setIconColor] = useState(WALLET_ICONS[0].bgColor)
  const [mode, setMode] = useState<"icon" | "photo">("icon")
  const [initialAmount, setInitialAmount] = useState("")
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)

  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null)
  const router = useRouter()

  //retrieve data from wallte to update
  const oldWallet: any = useLocalSearchParams()

  useEffect(() => {
    if (oldWallet?.id) {
      setWalletData({
        name: oldWallet?.name || "",
        image: oldWallet?.image || null,
      })
      if (oldWallet?.currency) setCurrency(oldWallet.currency)
      if (oldWallet?.amount) setInitialAmount(String(oldWallet.amount))
      const parsed = parseIconString(oldWallet?.image as any)
      if (parsed) {
        setIconId(parsed.id)
        setIconColor(parsed.color)
        setMode("icon")
      } else if (oldWallet?.image) {
        setMode("photo")
      }
      // fetch full wallet to get currency/amount if not in params
      if (!oldWallet?.currency || !oldWallet?.amount) {
        (async () => {
          try {
            const { supabase } = await import("@/config/supabase");
            const { data } = await supabase.from("wallets").select("currency,amount").eq("id", oldWallet.id).single();
            if (data) {
              if ((data as any).currency) setCurrency((data as any).currency)
              if ((data as any).amount != null) setInitialAmount(String((data as any).amount))
            }
          } catch {}
        })()
      }
    }
  }, [])

  //onsublmit function
  const onSubmit = async () => {
    let { name, image } = wallet
    if (!name.trim()) {
      const msg = t("pleaseEnterWalletName")
      setFeedback({ type: "error", msg })
      Alert.alert(t("wallet"), msg)
      return
    }
    let finalImage: string | null = null
    if (mode === "icon") {
      finalImage = toIconString(iconId, iconColor)
    } else {
      finalImage = typeof image === "string" ? image : (image as any)?.uri ?? null
    }
    const cleanAmount = Number(getNumberInput(initialAmount) || "0")
    const data: WalletType = {
      name,
      image: finalImage,
      uid: user?.uid,
      amount: cleanAmount,
      currency,
    } as any

    if (oldWallet?.id) data.id = oldWallet?.id

    setFeedback(null)
    setLoading(true)
    const result = await createOrUpdateWallet(data)
    setLoading(false)
    if (result.success) {
      setFeedback({ type: "success", msg: oldWallet?.id ? "Portefeuille mis à jour ✓" : "Portefeuille créé ✓" })
      Alert.alert(t("wallet"), oldWallet?.id ? "Portefeuille mis à jour" : "Portefeuille créé")
      setTimeout(() => closeModal(), 700)
    } else {
      const msg = result.msg || "Erreur"
      setFeedback({ type: "error", msg })
      Alert.alert(t("wallet"), msg)
    }
  }

  function closeModal() {
    try { (router as any).dismiss?.(); } catch {}
    // revient toujours vers la liste des portefeuilles
    setTimeout(() => {
      try { router.replace("/(tabs)/wallet" as any); } catch {
        try { router.back(); } catch {}
      }
    }, 100);
    setTimeout(() => { try { if (router.canGoBack()) router.back(); } catch {} }, 500);
  }

  const OnDelete = async () => {
    if (!oldWallet?.id) return
    setLoading(true)
    const result = await deleteWallet(oldWallet?.id)
    setLoading(false)
    if (result.success) {
      setFeedback({ type: "success", msg: t("walletDeleted") })
      Alert.alert(t("wallet"), t("walletDeleted"))
      setTimeout(() => closeModal(), 600)
    } else {
      const msg = result.msg || "Erreur"
      setFeedback({ type: "error", msg })
      Alert.alert(t("wallet"), msg)
    }
  }

  //Function show delete alert for deleting wallet
  const showDeleteAlert = () => {
    Alert.alert(
      t("confirmDeleteWallet"),
      t("deleteWalletMsg"),
      [
        { text: t("cancel"), onPress: () => {}, style: "cancel" },
        {
          text: t("delete"),
          onPress: () => OnDelete(),
          style: "destructive",
        },
      ],
    )
  }

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <HeaderComponent
          title={oldWallet?.id ? t("editWallet") : t("newWallet")}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        {/* //Form */}
        <ScrollView contentContainerStyle={styles.form}>
          {/* //inputContainer */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>{t("walletName")}</Typo>
            <TextInputComponent
              placeholder={t("enterWalletName")}
              value={wallet.name}
              onChangeText={(value: any) =>
                setWalletData({ ...wallet, name: value })
              }
            />
          </View>
          {/* Montant initial + Devise */}
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Typo color={colors.neutral200}>{oldWallet?.id ? "Solde" : "Solde initial"}</Typo>
              <TextInputComponent
                placeholder="0"
                value={formatNumberInput(initialAmount)}
                onChangeText={(v: string) => setInitialAmount(getNumberInput(v))}
                keyboardType="numeric"
              />
              <Typo size={11} color={colors.neutral500}>{oldWallet?.id ? "Modifiable ici ou via transactions" : "Montant de départ"}</Typo>
            </View>
            <View style={[styles.inputContainer, { flex: 1.1 }]}>
              <Typo color={colors.neutral200}>Devise</Typo>
              <Dropdown
                style={styles.dropdown}
                containerStyle={styles.dropdownList}
                selectedTextStyle={styles.dropdownText}
                placeholderStyle={styles.dropdownText}
                itemTextStyle={styles.dropdownItemText}
                activeColor={colors.neutral700}
                data={WORLD_CURRENCIES.map((c) => ({ label: `${c.code} ${c.name}`, value: c.code }))}
                labelField="label"
                valueField="value"
                value={currency}
                onChange={(it) => setCurrency(it.value)}
                search
                searchPlaceholder="Rechercher..."
                inputSearchStyle={styles.searchInput}
                maxHeight={320}
              />
            </View>
          </View>
          <View style={styles.currencyHint}>
            <Icons.Info size={14} color={colors.neutral400} />
            <Typo size={12} color={colors.neutral400}>{WORLD_CURRENCIES.find((c) => c.code === currency)?.symbol} {WORLD_CURRENCIES.find((c) => c.code === currency)?.name}</Typo>
          </View>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>{t("chooseIcon")}</Typo>
            <View style={styles.tabRow}>
              <Pressable onPress={() => setMode("icon")} style={[styles.tab, mode === "icon" && styles.tabActive]}>
                <Icons.Smiley size={16} color={mode === "icon" ? colors.white : colors.neutral400} weight="fill" />
                <Typo size={13} color={mode === "icon" ? colors.white : colors.neutral400} fontWeight="700">Icônes</Typo>
              </Pressable>
              <Pressable onPress={() => setMode("photo")} style={[styles.tab, mode === "photo" && styles.tabActive]}>
                <Icons.Image size={16} color={mode === "photo" ? colors.white : colors.neutral400} weight="fill" />
                <Typo size={13} color={mode === "photo" ? colors.white : colors.neutral400} fontWeight="700">Photo</Typo>
              </Pressable>
            </View>
            {mode === "icon" ? (
              <IconPicker selectedId={iconId} selectedColor={iconColor} onSelectId={setIconId} onSelectColor={setIconColor} />
            ) : (
              <ImageUpload
                file={wallet.image}
                onSelect={(file: any) => setWalletData({ ...wallet, image: file })}
                onClear={() => setWalletData({ ...wallet, image: null })}
                placeholder={t("addImage")}
              />
            )}
          </View>
          {feedback && (
            <View style={[styles.feedback, { backgroundColor: feedback.type === "success" ? "#16a34a20" : "#ef444420", borderColor: feedback.type === "success" ? "#16a34a" : "#ef4444" }]}>
              <Typo size={14} color={feedback.type === "success" ? "#16a34a" : "#ef4444"} style={{ textAlign: "center" }}>{feedback.msg}</Typo>
            </View>
          )}
        </ScrollView>
      </View>
      {/* //footer area*/}
      <View style={styles.footer}>
        {oldWallet?.id && !loading && (
          <ButtonComponent
            onPress={showDeleteAlert}
            style={{
              backgroundColor: colors.rose,
              paddingHorizontal: spacingX._15,
            }}
          >
            <Icons.Trash
              color={colors.white}
              size={verticalScale(24)}
              weight="bold"
            />
          </ButtonComponent>
        )}
        <ButtonComponent
          onPress={onSubmit}
          loading={loading}
          style={{ flex: 1 }}
        >
          <Typo color={colors.white} fontWeight="800">
            {oldWallet?.id ? t("updateWallet") : t("addWallet")}
          </Typo>
        </ButtonComponent>
      </View>
    </ModalWrapper>
  )
}

export default WalletModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacingY._20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingX._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingX._5,
    borderTopWidth: 1,
  },
  form: {
    gap: spacingY._30,
    marginTop: spacingY._15,
  },
  avatarContainer: {
    position: "relative",
    alignSelf: "center",
  },
  avatar: {
    alignSelf: "center",
    backgroundColor: colors.neutral350,
    height: verticalScale(135),
    width: verticalScale(135),
    borderRadius: 200,
    borderWidth: 1,
    borderColor: colors.neutral500,
  },
  editIcon: {
    position: "absolute",
    bottom: spacingY._5,
    right: spacingY._7,
    backgroundColor: colors.neutral100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    padding: spacingY._7,
    borderRadius: 50,
    elevation: 4,
  },
  inputContainer: {
    gap: spacingY._10,
  },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  dropdown: {
    height: verticalScale(54),
    borderWidth: 1,
    borderColor: colors.neutral500,
    borderRadius: radius._12,
    paddingHorizontal: spacingX._12,
    backgroundColor: colors.neutral800,
  },
  dropdownText: { color: colors.white, fontSize: 14 },
  dropdownItemText: { color: colors.white, fontSize: 13 },
  dropdownList: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._12,
    borderColor: colors.neutral600,
    borderWidth: 1,
  },
  searchInput: { color: colors.white, borderColor: colors.neutral600 },
  currencyHint: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: -16 },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.neutral800,
    padding: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.neutral700,
  },
  feedback: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 4 },
})
