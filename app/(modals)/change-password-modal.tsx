import BackButton from "@/components/back-button"
import Button from "@/components/button"
import Header from "@/components/header"
import Input from "@/components/input"
import ModalWrapper from "@/components/modal-wrapper"
import Typo from "@/components/typo"
import { colors, spacingX, spacingY } from "@/constants/theme"
import { useAuth } from "@/context/auth-context"
import { useLocale } from "@/context/locale-context"
import { useToast } from "@/context/toast-context"
import { scale, verticalScale } from "@/utils/styling"
import { useRouter } from "expo-router"
import * as Icons from "phosphor-react-native"
import React, { useState } from "react"
import { Alert, ScrollView, StyleSheet, View } from "react-native"

const ChangePasswordModal = () => {
  const { updatePassword } = useAuth()
  const { t } = useLocale()
  const { showToast } = useToast()
  const router = useRouter()
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null)

  const handleSubmit = async () => {
    if (loading) return;
    const { oldPassword, newPassword, confirmPassword } = passwords

    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      const msg = t("pleaseFillAllFields")
      setFeedback({ type: "error", msg }); Alert.alert(t("warning"), msg); return
    }

    if (newPassword !== confirmPassword) {
      const msg = t("newPasswordNotMatch")
      setFeedback({ type: "error", msg }); Alert.alert(t("warning"), msg); return
    }

    if (newPassword.length < 6) {
      const msg = t("newPasswordMin6")
      setFeedback({ type: "error", msg }); Alert.alert(t("warning"), msg); return
    }

    setFeedback(null)
    setLoading(true)
    const res = await updatePassword(oldPassword, newPassword)
    setLoading(false)

    if (res.success) {
      setFeedback({ type: "success", msg: t("passwordUpdated") })
      showToast("success", "Mot de passe mis à jour", "Sécurité renforcée 🔒")
      setTimeout(() => {
        try { (router as any).dismiss?.(); } catch {}
        setTimeout(() => {
          try {
            const stillModal = typeof window !== "undefined" && window.location.pathname.endsWith("change-password-modal");
            if (!stillModal) return;
            if (router.canGoBack()) router.back(); else router.replace("/(tabs)/more" as any);
          } catch {}
        }, 250)
      }, 800)
    } else {
      const msg = res.msg || t("failedUpdatePassword")
      setFeedback({ type: "error", msg }); showToast("error", "Erreur", msg); Alert.alert(t("error"), msg)
    }
  }

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={t("changePassword")}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />
        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>{t("oldPassword")}</Typo>
            <Input
              placeholder={t("enterOldPassword")}
              value={passwords.oldPassword}
              onChangeText={(value) =>
                setPasswords({ ...passwords, oldPassword: value })
              }
              type="password"
              icon={
                <Icons.Lock
                  size={verticalScale(26)}
                  color={colors.neutral350}
                  weight="fill"
                />
              }
            />
          </View>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>{t("newPassword")}</Typo>
            <Input
              placeholder={t("enterNewPassword")}
              value={passwords.newPassword}
              type="password"
              onChangeText={(value) =>
                setPasswords({ ...passwords, newPassword: value })
              }
              icon={
                <Icons.Lock
                  size={verticalScale(26)}
                  color={colors.neutral350}
                  weight="fill"
                />
              }
            />
          </View>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>{t("confirmNewPassword")}</Typo>
            <Input
              placeholder={t("enterNewPasswordAgain")}
              value={passwords.confirmPassword}
              type="password"
              onChangeText={(value) =>
                setPasswords({ ...passwords, confirmPassword: value })
              }
              icon={
                <Icons.Lock
                  size={verticalScale(26)}
                  color={colors.neutral350}
                  weight="fill"
                />
              }
            />
          </View>
          {feedback && (
            <View style={[styles.feedback, { backgroundColor: feedback.type === "success" ? "#16a34a20" : "#ef444420", borderColor: feedback.type === "success" ? "#16a34a" : "#ef4444" }]}>
              <Typo size={14} color={feedback.type === "success" ? "#16a34a" : "#ef4444"} style={{ textAlign: "center" }}>{feedback.msg}</Typo>
            </View>
          )}
        </ScrollView>
      </View>
      <View style={styles.footer}>
        <Button onPress={handleSubmit} loading={loading} style={{ flex: 1 }}>
          <Typo color={colors.white} fontWeight={"700"}>
            {t("update")}
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  )
}

export default ChangePasswordModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacingY._20,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingY._5,
    borderTopWidth: 1,
  },
  form: {
    gap: spacingY._30,
    marginTop: spacingY._15,
  },
  inputContainer: {
    gap: spacingY._10,
  },
  feedback: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 4 },
})
