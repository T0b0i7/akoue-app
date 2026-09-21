import { colors, radius } from "@/constants/theme"
import { useToast } from "@/context/toast-context"
import * as Haptics from "expo-haptics"
import { BlurView } from "expo-blur"
import * as Icons from "phosphor-react-native"
import React, { useEffect } from "react"
import { Platform, StyleSheet, View } from "react-native"
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from "react-native-reanimated"
import Typo from "./typo"

export const AppToast = () => {
  const { toast } = useToast()

  useEffect(() => {
    if (!toast) return
    if (Platform.OS !== "web") {
      if (toast.type === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      else if (toast.type === "error") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      else Haptics.selectionAsync()
    }
  }, [toast])

  if (!toast) return null

  const bg = toast.type === "success" ? "#16a34a" : toast.type === "error" ? "#e11d48" : "#7A4DFF"
  const Icon = toast.type === "success" ? Icons.Check : toast.type === "error" ? Icons.Warning : Icons.Info

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View
        entering={FadeInDown.springify().damping(16).mass(0.8)}
        exiting={FadeOutUp.duration(280)}
        layout={LinearTransition.springify().damping(18)}
        style={styles.shadow}
      >
        <BlurView intensity={24} tint="dark" style={styles.blur}>
          <View style={[styles.iconCircle, { backgroundColor: bg }]}>
            <Icon size={18} color="#fff" weight="bold" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Typo size={14} fontWeight="700" color="#fff" style={{ lineHeight: 18 }}>{toast.title}</Typo>
            {!!toast.message && <Typo size={12} color="rgba(255,255,255,0.78)" style={{ lineHeight: 15 }}>{toast.message}</Typo>}
          </View>
        </BlurView>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: Platform.OS === "web" ? 18 : 54,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
  },
  shadow: {
    width: "100%",
    maxWidth: 420,
    borderRadius: radius._15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  blur: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(23,23,23,0.88)",
    overflow: "hidden",
  },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
})
