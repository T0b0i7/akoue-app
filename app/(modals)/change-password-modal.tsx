import BackButton from "@/components/back-button"
import Button from "@/components/button"
import Header from "@/components/header"
import Input from "@/components/input"
import ModalWrapper from "@/components/modal-wrapper"
import Typo from "@/components/typo"
import { colors, spacingX, spacingY } from "@/constants/theme"
import { useAuth } from "@/context/auth-context"
import { useLocale } from "@/context/locale-context"
import { scale, verticalScale } from "@/utils/styling"
import { useRouter } from "expo-router"
import * as Icons from "phosphor-react-native"
import React, { useState } from "react"
import { Alert, ScrollView, StyleSheet, View } from "react-native"

const ChangePasswordModal = () => {
  const { updatePassword } = useAuth()
  const { t } = useLocale()
  const router = useRouter()
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    const { oldPassword, newPassword, confirmPassword } = passwords

    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert(t("warning"), t("pleaseFillAllFields"))
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t("warning"), t("newPasswordNotMatch"))
      return
    }

    if (newPassword.length < 6) {
      Alert.alert(t("warning"), t("newPasswordMin6"))
      return
    }

    setLoading(true)
    const res = await updatePassword(oldPassword, newPassword)
    setLoading(false)

    if (res.success) {
      Alert.alert(t("success"), t("passwordUpdated"), [
        {
          text: t("ok"),
          onPress: () => {
            router.back()
          },
        },
      ])
    } else {
      Alert.alert(t("error"), res.msg || t("failedUpdatePassword"))
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
})
