import BackButton from "@/components/back-button"
import Button from "@/components/button"
import Header from "@/components/header"
import Input from "@/components/input"
import ModalWrapper from "@/components/modal-wrapper"
import Typo from "@/components/typo"
import { colors, radius, spacingX, spacingY } from "@/constants/theme"
import { useAuth } from "@/context/auth-context"
import { useLocale } from "@/context/locale-context"
import { useToast } from "@/context/toast-context"
import { getProfileImage } from "@/services/images-service"
import { updateUser } from "@/services/user-service"
import { UserDataType } from "@/types"
import { scale, verticalScale } from "@/utils/styling"
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import * as Icons from "phosphor-react-native"
import { useRouter } from "expo-router"
import React, { useEffect, useState } from "react"
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"

const EditProfileModal = () => {
  const { user, updateUserData } = useAuth()
  const { t } = useLocale()
  const { showToast } = useToast()
  const router = useRouter()
  const [userData, setUserData] = useState<UserDataType>({
    name: "",
    image: null,
  })
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null)

  useEffect(() => {
    setUserData({
      name: user?.name || "",
      image: user?.image || null,
    })
  }, [user])

  const handleImagePicker = async () => {
    // Remplacé par sélection Homme/Femme — plus fiable que l'upload
  }

  const handleSubmit = async () => {
    if (loading) return;
    let { name } = userData
    if (!name.trim()) {
      const msg = t("pleaseEnterName")
      setFeedback({ type: "error", msg })
      Alert.alert(t("warning"), msg)
      return
    }

    setFeedback(null)
    setLoading(true)
    const res = await updateUser(user?.uid as string, userData)
    setLoading(false)
    if (res.success) {
      await updateUserData(user?.uid as string)
      setFeedback({ type: "success", msg: "Profil mis à jour ✓" })
      showToast("success", "Profil mis à jour", `Bien joué ${userData.name} ✨`)
      setTimeout(() => {
        try { (router as any).dismiss?.(); } catch {}
        setTimeout(() => {
          try {
            const stillModal = typeof window !== "undefined" && window.location.pathname.endsWith("update-profile-modal");
            if (!stillModal) return;
            if (router.canGoBack()) router.back(); else router.replace("/(tabs)/more" as any);
          } catch {}
        }, 250)
      }, 800)
    } else {
      const msg = res.msg || t("updateFailed")
      setFeedback({ type: "error", msg })
      showToast("error", "Erreur", msg)
      Alert.alert(t("error"), msg)
    }
  }

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={t("updateProfile")}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />
        {/* form */}
        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.avatarContainer}>
            <Image
              style={styles.avatar}
              source={getProfileImage(userData.image)}
              contentFit="cover"
              transition={100}
            />
          </View>
          <View style={styles.genderRow}>
            <TouchableOpacity
              onPress={() => setUserData({ ...userData, image: "male" })}
              style={[styles.genderBtn, userData.image === "male" && styles.genderBtnActiveMale]}
            >
              <Icons.GenderMale size={28} color={userData.image === "male" ? "#fff" : colors.neutral400} weight="fill" />
              <Typo size={14} fontWeight="600" color={userData.image === "male" ? "#fff" : colors.neutral400}>Homme</Typo>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setUserData({ ...userData, image: "female" })}
              style={[styles.genderBtn, userData.image === "female" && styles.genderBtnActiveFemale]}
            >
              <Icons.GenderFemale size={28} color={userData.image === "female" ? "#fff" : colors.neutral400} weight="fill" />
              <Typo size={14} fontWeight="600" color={userData.image === "female" ? "#fff" : colors.neutral400}>Femme</Typo>
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>{t("name")}</Typo>
            <Input
              placeholder={t("enterName")}
              value={userData.name}
              onChangeText={(value) =>
                setUserData({ ...userData, name: value })
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

export default EditProfileModal

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
  genderRow: { flexDirection: "row", gap: spacingX._15, justifyContent: "center", marginTop: spacingY._10 },
  genderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: spacingY._12,
    borderRadius: radius._15,
    borderWidth: 1.5,
    borderColor: colors.neutral700,
    backgroundColor: colors.neutral800,
  },
  genderBtnActiveMale: { backgroundColor: "#0ea5e9", borderColor: "#0ea5e9" },
  genderBtnActiveFemale: { backgroundColor: "#ec4899", borderColor: "#ec4899" },
  editIcon: {
    position: "absolute",
    bottom: spacingY._5,
    right: spacingY._7,
    borderRadius: 100,
    backgroundColor: colors.neutral100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    padding: spacingY._7,
  },
  inputContainer: {
    gap: spacingY._10,
  },
  feedback: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
})
