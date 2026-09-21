import { colors, radius, spacingX, spacingY } from "@/constants/theme"
import { useLocale } from "@/context/locale-context"
import { verticalScale } from "@/utils/styling"
import { useRouter } from "expo-router"
import * as Icons from "phosphor-react-native"
import React from "react"
import { StyleSheet, TouchableOpacity, View } from "react-native"
import Typo from "@/components/typo"

export default function LanguageSelect() {
  const { setLanguage } = useLocale()
  const router = useRouter()

  const choose = async (lang: "fr" | "en") => {
    await setLanguage(lang)
    router.replace("/(auth)/welcome" as any)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typo size={28} fontWeight="800" style={{ textAlign: "center" }}>Choisis ta langue</Typo>
        <Typo size={28} fontWeight="800" style={{ textAlign: "center" }}>Choose your language</Typo>
        <Typo size={14} color={colors.neutral400} style={{ textAlign: "center", marginTop: 8 }}>Tu pourras changer à tout moment dans Paramètres</Typo>
      </View>

      <View style={styles.cards}>
        <TouchableOpacity onPress={() => choose("fr")} style={[styles.card, { borderColor: "#0ea5e9" }]}>
          <View style={[styles.flag, { backgroundColor: "#0ea5e9" }]}>
            <Typo size={28}>🇫🇷</Typo>
          </View>
          <Typo size={20} fontWeight="700">Français</Typo>
          <Typo size={13} color={colors.neutral400}>Continuer en français</Typo>
          <View style={styles.arrow}><Icons.CaretRight size={18} color={colors.white} weight="bold" /></View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => choose("en")} style={[styles.card, { borderColor: "#7A4DFF" }]}>
          <View style={[styles.flag, { backgroundColor: "#7A4DFF" }]}>
            <Typo size={28}>🇬🇧</Typo>
          </View>
          <Typo size={20} fontWeight="700">English</Typo>
          <Typo size={13} color={colors.neutral400}>Continue in English</Typo>
          <View style={styles.arrow}><Icons.CaretRight size={18} color={colors.white} weight="bold" /></View>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#171717", paddingHorizontal: spacingX._20, paddingTop: verticalScale(60), justifyContent: "center" },
  header: { marginBottom: verticalScale(40) },
  cards: { gap: spacingY._15 },
  card: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._15,
    borderWidth: 1.5,
    padding: spacingX._20,
    alignItems: "center",
    gap: 6,
    position: "relative",
  },
  flag: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  arrow: { position: "absolute", right: spacingX._15, top: "50%", backgroundColor: colors.neutral700, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
})
