import React from "react"
import { Pressable, StyleSheet, View } from "react-native"
import Typo from "@/components/typo"
import { colors } from "@/constants/theme"
import { ArrowLeftIcon as IconArrowLeft } from "phosphor-react-native/src/icons/ArrowLeft"
import { SpeakerHighIcon as IconSpeakerHigh } from "phosphor-react-native/src/icons/SpeakerHigh"
import { SpeakerXIcon as IconSpeakerX } from "phosphor-react-native/src/icons/SpeakerX"
import { useRouter } from "expo-router"
import { useLocale } from "@/context/locale-context"
import { useAudio } from "@/context/audio-context"

type AuthHeaderProps = {
  backTo: string
  title?: string
}

export function AuthHeader({ backTo, title }: AuthHeaderProps) {
  const router = useRouter()
  const { t } = useLocale()
  const { muted, toggleSound } = useAudio()
  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.replace(backTo as any)} style={styles.backBtn} hitSlop={20}>
        <IconArrowLeft size={16} color={colors.primary} />
        <Typo size={14} color={colors.primary} fontWeight="700">
          {t("back")}
        </Typo>
      </Pressable>
      {title && (
        <Typo size={16} fontWeight="800" color={colors.white} style={styles.title}>
          {title}
        </Typo>
      )}
      <View style={styles.soundShell}>
        <Pressable onPress={toggleSound} style={styles.soundBtn} hitSlop={20}>
          {muted ? (
            <IconSpeakerX size={18} color={colors.neutral400} />
          ) : (
            <IconSpeakerHigh size={18} color={colors.white} />
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontWeight: "800",
    color: colors.white,
  },
  soundShell: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  soundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
})
