import { colors, radius, spacingX, spacingY } from "@/constants/theme"
import { useLocale } from "@/context/locale-context"
import { verticalScale } from "@/utils/styling"
import { useRouter } from "expo-router"
import * as Icons from "phosphor-react-native"
import React from "react"
import { StyleSheet, TouchableOpacity, View } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Image } from "expo-image"
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated"
import Typo from "@/components/typo"

export default function LanguageSelect() {
  const { setLanguage } = useLocale()
  const router = useRouter()

  const choose = async (lang: "fr" | "en") => {
    await setLanguage(lang)
    router.replace("/(auth)/welcome" as any)
  }

  return (
    <View style={styles.root}>
      {/* Ethereal Glass orbs */}
      <LinearGradient colors={["#1a0b2e", "#050505"]} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.orbPurple} />
      <View pointerEvents="none" style={styles.orbViolet} />
      <View pointerEvents="none" style={styles.grain} />

      <View style={styles.content}>
        {/* Eyebrow */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.eyebrow}>
          <View style={styles.eyebrowDot} />
          <Typo size={10} color={colors.neutral400} style={{ letterSpacing: 3, textTransform: "uppercase" }}>Préférence • Preference</Typo>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.springify().damping(18).delay(120)} style={styles.titleBlock}>
          <Typo size={34} fontWeight="800" style={{ textAlign: "center", lineHeight: 38 }}>
            Choisis ta langue
          </Typo>
          <Typo size={34} fontWeight="800" color={colors.neutral400} style={{ textAlign: "center", lineHeight: 38, marginTop: -2 }}>
            Choose your language
          </Typo>
          <Typo size={13} color={colors.neutral500} style={{ textAlign: "center", marginTop: 14, lineHeight: 19 }}>
            Tu pourras changer à tout moment dans{`\n`}Paramètres • Settings
          </Typo>
        </Animated.View>

        {/* Cards — Double-Bezel */}
        <View style={styles.cards}>
          {/* FR */}
          <Animated.View entering={FadeInDown.springify().damping(18).delay(220)} style={styles.outerShell}>
            <TouchableOpacity activeOpacity={0.88} onPress={() => choose("fr")} style={styles.innerCore}>
              <View style={styles.cardTop}>
                <View style={[styles.flagCircle, { backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", overflow: "hidden" }]}>
                  <Image source={{ uri: "https://flagcdn.com/w80/fr.png" }} style={{ width: 48, height: 48 }} contentFit="cover" />
                </View>
                <View style={styles.cardText}>
                  <Typo size={18} fontWeight="700">Français</Typo>
                  <Typo size={12} color={colors.neutral400}>Continuer en français</Typo>
                </View>
                <View style={styles.trailingCircle}>
                  <Icons.ArrowUpRight size={16} color="#fff" weight="bold" />
                </View>
              </View>
              <View style={styles.hairline} />
              <View style={styles.metaRow}>
                <View style={styles.metaPill}><Typo size={10} color={colors.neutral400} style={{ letterSpacing: 1 }}>XOF • CFA • FR</Typo></View>
                <Typo size={11} color={colors.neutral500}>Par défaut</Typo>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* EN */}
          <Animated.View entering={FadeInDown.springify().damping(18).delay(340)} style={styles.outerShell}>
            <TouchableOpacity activeOpacity={0.88} onPress={() => choose("en")} style={styles.innerCore}>
              <View style={styles.cardTop}>
                <View style={[styles.flagCircle, { backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", overflow: "hidden" }]}>
                  <Image source={{ uri: "https://flagcdn.com/w80/us.png" }} style={{ width: 48, height: 48 }} contentFit="cover" />
                </View>
                <View style={styles.cardText}>
                  <Typo size={18} fontWeight="700">English</Typo>
                  <Typo size={12} color={colors.neutral400}>Continue in English</Typo>
                </View>
                <View style={styles.trailingCircle}>
                  <Icons.ArrowUpRight size={16} color="#fff" weight="bold" />
                </View>
              </View>
              <View style={styles.hairline} />
              <View style={styles.metaRow}>
                <View style={styles.metaPill}><Typo size={10} color={colors.neutral400} style={{ letterSpacing: 1 }}>USD • EUR • EN</Typo></View>
                <Typo size={11} color={colors.neutral500}>Default</Typo>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.delay(520)} style={styles.footer}>
          <Typo size={11} color={colors.neutral500} style={{ textAlign: "center" }}>Akouè • Maîtrise ton argent • 1.0.0</Typo>
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050505" },
  orbPurple: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: "rgba(122,77,255,0.14)",
    top: -120,
    right: -80,
  },
  orbViolet: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(14,165,233,0.08)",
    bottom: -60,
    left: -60,
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    opacity: 0.03,
  },
  content: { flex: 1, paddingHorizontal: spacingX._20, paddingTop: verticalScale(44), paddingBottom: verticalScale(28), justifyContent: "center" },
  eyebrow: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#7A4DFF" },
  titleBlock: { alignItems: "center", marginTop: verticalScale(22), marginBottom: verticalScale(28) },
  cards: { gap: spacingY._15 },
  // Double-Bezel
  outerShell: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    padding: 6,
    borderRadius: 28,
  },
  innerCore: {
    backgroundColor: "#141414",
    borderRadius: 22,
    padding: spacingX._15,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 1,
    gap: 14,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacingX._12 },
  flagCircle: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  cardText: { flex: 1, gap: 2 },
  // Button-in-Button
  trailingCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  hairline: { height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metaPill: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  footer: { marginTop: verticalScale(28), alignItems: "center" },
})
