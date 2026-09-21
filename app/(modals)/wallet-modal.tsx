import BackButton from "@/components/back-button"
import ButtonComponent from "@/components/button"
import HeaderComponent from "@/components/header"
import ImageUpload from "@/components/image-upload"
import ModalWrapper from "@/components/modal-wrapper"
import TextInputComponent from "@/components/text-input"
import Typo from "@/components/typo"
import { colors, spacingX, spacingY } from "@/constants/theme"
import { useAuth } from "@/context/auth-context"
import { useLocale } from "@/context/locale-context"
import { createOrUpdateWallet, deleteWallet } from "@/services/wallet-service"
import { WalletType } from "@/types"
import { scale, verticalScale } from "@/utils/styling"
import { useLocalSearchParams, useRouter } from "expo-router"
import * as Icons from "phosphor-react-native"
import React, { useEffect, useState } from "react"
import { Alert, ScrollView, StyleSheet, View } from "react-native"

const WalletModal = () => {
  const { user } = useAuth()
  const { t } = useLocale()
  const [wallet, setWalletData] = useState<WalletType>({
    name: "",
    image: null,
  })

  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null)
  const router = useRouter()

  //retrieve data from wallte to update
  const oldWallet: { name: string; image: string; id: string } =
    useLocalSearchParams()

  useEffect(() => {
    if (oldWallet?.id) {
      setWalletData({
        name: oldWallet?.name || "",
        image: oldWallet?.image || null,
      })
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
    const finalImage = typeof image === "string" ? image : (image as any)?.uri ?? null
    const data: WalletType = {
      name,
      image: finalImage,
      uid: user?.uid,
    }

    if (oldWallet?.id) data.id = oldWallet?.id

    setFeedback(null)
    setLoading(true)
    const result = await createOrUpdateWallet(data)
    setLoading(false)
    if (result.success) {
      setFeedback({ type: "success", msg: oldWallet?.id ? "Portefeuille mis à jour ✓" : "Portefeuille créé ✓" })
      Alert.alert(t("wallet"), oldWallet?.id ? "Portefeuille mis à jour" : "Portefeuille créé")
      setTimeout(() => router.back(), 800)
    } else {
      const msg = result.msg || "Erreur"
      setFeedback({ type: "error", msg })
      Alert.alert(t("wallet"), msg)
    }
  }

  const OnDelete = async () => {
    if (!oldWallet?.id) return
    setLoading(true)
    const result = await deleteWallet(oldWallet?.id)
    setLoading(false)
    if (result.success) {
      setFeedback({ type: "success", msg: t("walletDeleted") })
      Alert.alert(t("wallet"), t("walletDeleted"))
      setTimeout(() => router.back(), 700)
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
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>{t("chooseIcon")}</Typo>
            {/* Image input */}
            <ImageUpload
              file={wallet.image}
              onSelect={(file: any) =>
                setWalletData({ ...wallet, image: file })
              }
              onClear={() => setWalletData({ ...wallet, image: null })}
              placeholder={t("addImage")}
            />
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
  feedback: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 4 },
})
