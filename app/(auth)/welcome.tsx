import ButtonComponent from "@/components/button"
import ScreenWrapper from "@/components/screen-wrapper"
import Typo from "@/components/typo"
import { colors, spacingX, spacingY } from "@/constants/theme"
import { verticalScale } from "@/utils/styling"
import { Image, Platform, Pressable, StyleSheet, View } from "react-native"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"
import AnimatedOrbs from "@/components/animated-orbs"
import { ArrowRightIcon as IconArrowRight } from "phosphor-react-native/src/icons/ArrowRight";
import { ChartBarIcon as IconChartBar } from "phosphor-react-native/src/icons/ChartBar";
import { SpeakerHighIcon as IconSpeakerHigh } from "phosphor-react-native/src/icons/SpeakerHigh";
import { SpeakerXIcon as IconSpeakerX } from "phosphor-react-native/src/icons/SpeakerX";
import { WalletIcon as IconWallet } from "phosphor-react-native/src/icons/Wallet";
import { WifiSlashIcon as IconWifiSlash } from "phosphor-react-native/src/icons/WifiSlash";
import { useAudioPlayer } from "expo-audio"
import { useEffect, useRef, useState } from "react"

import { useRouter } from "expo-router"
import { useLocale } from "@/context/locale-context"

const Welcome = () => {
  const router = useRouter()
  const { t } = useLocale()
  const [muted, setMuted] = useState(false)
  const player = useAudioPlayer(require("@/public/sounds/money-theme.wav"))
  const played = useRef(false)

  useEffect(() => {
    if (played.current || muted) return
    played.current = true
    try {
      player.loop = true
      player.volume = 0.35
    } catch {}
    const start = () => {
      try {
        player.play()
      } catch {}
    }
    const id = setTimeout(start, 450)
    // Web : les navigateurs bloquent l'autoplay -> on demarre au 1er geste.
    let unlock: (() => void) | null = null
    if (Platform.OS === "web" && typeof document !== "undefined") {
      unlock = () => {
        start()
        document.removeEventListener("pointerdown", unlock!)
        document.removeEventListener("keydown", unlock!)
      }
      document.addEventListener("pointerdown", unlock)
      document.addEventListener("keydown", unlock)
    }
    return () => {
      clearTimeout(id)
      if (unlock) {
        document.removeEventListener("pointerdown", unlock)
        document.removeEventListener("keydown", unlock)
      }
    }
  }, [muted])

  // Fond "blobs" ondulants : voir components/animated-orbs.tsx
  const toggleSound = () => {
    const next = !muted
    setMuted(next)
    try {
      if (next) player.pause()
      else {
        player.loop = true
        player.play()
      }
    } catch {}
  }

  return (
    <ScreenWrapper>
      <View style={styles.root}>
        <AnimatedOrbs />

        <View style={styles.topBar}>
          <View style={styles.soundShell}>
            <Pressable onPress={toggleSound} style={styles.soundBtn} hitSlop={10}>
              {muted ? (
                <IconSpeakerX size={20} color={colors.neutral400} />
              ) : (
                <IconSpeakerHigh size={20} color={colors.white} />
              )}
            </Pressable>
          </View>
          <Pressable
            onPress={() => router.navigate("/(auth)/login")}
            style={styles.loginPill}
          >
            <Typo fontWeight="600" color={colors.white} size={14}>
              {t("login")}
            </Typo>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Animated.View entering={FadeIn.duration(500)} style={styles.logoShell}>
            <View style={styles.logoCore}>
              <Image
                source={require("@/public/images/mono-akoue.png")}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.titles}>
            <View style={styles.eyebrow}>
              <Typo size={10} color={colors.neutral400} fontWeight="700" style={styles.eyebrowText}>
                MAITRISE TON ARGENT
              </Typo>
            </View>
            <Typo size={44} fontWeight="800" color={colors.white} style={styles.brand}>
              Akouè
            </Typo>
            <Typo size={22} fontWeight="800" color={colors.white} style={styles.headline}>
              {t("alwaysTakeControl")}
            </Typo>
            <Typo size={22} fontWeight="800" color={colors.primary} style={styles.headline}>
              {t("ofYourFinances")}
            </Typo>
            <Typo size={14} color={colors.neutral400} style={styles.sub}>
              {t("financesMustBeArranged")} {t("lifestyleInFuture")}
            </Typo>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.chips}>
            <View style={styles.chip}>
              <IconWallet size={16} color={colors.primary} />
              <Typo size={12} color={colors.white} fontWeight="600">Multi-portefeuilles</Typo>
            </View>
            <View style={styles.chip}>
              <IconChartBar size={16} color={colors.green} />
              <Typo size={12} color={colors.white} fontWeight="600">Stats en direct</Typo>
            </View>
            <View style={styles.chip}>
              <IconWifiSlash size={16} color={colors.neutral400} />
              <Typo size={12} color={colors.white} fontWeight="600">100% hors ligne</Typo>
            </View>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInDown.duration(600).delay(300)}
          style={styles.footer}
        >
          <ButtonComponent onPress={() => router.navigate("/(auth)/sign-up")}>
            <Typo size={18} color={colors.white} fontWeight="700">
              {t("getStarted")}
            </Typo>
            <View style={styles.trailingIcon}>
              <IconArrowRight size={18} color={colors.white} weight="bold" />
            </View>
          </ButtonComponent>
          <Pressable onPress={() => router.navigate("/(auth)/login")}>
            <Typo size={14} color={colors.neutral400} fontWeight="600" style={styles.loginLink}>
              Déjà un compte ? Se connecter
            </Typo>
          </Pressable>
        </Animated.View>
      </View>
    </ScreenWrapper>
  )
}

export default Welcome

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
    backgroundColor: "#05070F",
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._15,
    paddingBottom: spacingY._30,
    justifyContent: "space-between",
    gap: spacingY._20,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  soundShell: {
    padding: 2,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  soundBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  loginPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  hero: {
    alignItems: "center",
    gap: spacingY._20,
  },
  logoShell: {
    padding: 8,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#0A5CFF",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 12,
  },
  logoCore: {
    width: verticalScale(120),
    height: verticalScale(120),
    borderRadius: 36,
    backgroundColor: "#0B1530",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: {
    width: verticalScale(104),
    height: verticalScale(104),
    borderRadius: 22,
  },
  titles: {
    alignItems: "center",
    gap: 4,
  },
  eyebrow: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(122,77,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(122,77,255,0.28)",
    marginBottom: 6,
  },
  eyebrowText: {
    letterSpacing: 2,
  },
  brand: {
    letterSpacing: 1,
    textAlign: "center",
  },
  headline: {
    textAlign: "center",
    lineHeight: 28,
  },
  sub: {
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: spacingX._25,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  footer: {
    gap: 12,
  },
  trailingIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  loginLink: {
    textAlign: "center",
  },
})
