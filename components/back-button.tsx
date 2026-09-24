import { useRouter, usePathname } from "expo-router";
import { CaretLeft } from "phosphor-react-native";
import React, { useRef } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { colors, radius } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";

const getFallback = (pathname: string | null, fallbackProp?: string) => {
  if (fallbackProp) return fallbackProp;
  if (!pathname) return "/(tabs)";
  if (
    pathname.endsWith("exchange-rate-modal") ||
    pathname.endsWith("loan-calculator-modal") ||
    pathname.endsWith("split-bill-modal") ||
    pathname.endsWith("export-data-modal") ||
    pathname.endsWith("setting-modal") ||
    pathname.endsWith("notifications-modal") ||
    pathname.endsWith("profile-modal") ||
    pathname.endsWith("update-profile-modal") ||
    pathname.endsWith("change-password-modal")
  ) {
    return "/(tabs)/more";
  }
  if (pathname.endsWith("wallet-modal")) return "/(tabs)/wallet";
  if (pathname.endsWith("search-modal")) return "/(tabs)";
  if (pathname.endsWith("transaction-modal")) return "/(tabs)";
  return "/(tabs)";
};

const BackButton = ({
  size = 26,
  color = "white",
  weight = "bold",
  style,
  fallback,
}: any & { fallback?: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const dismissingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBack = () => {
    if (dismissingRef.current) return;
    const fallbackRoute = getFallback(pathname, fallback);
    const current = pathname;
    try {
      // @ts-ignore dismiss existe en expo-router 3+
      if ((router as any).dismiss) {
        dismissingRef.current = true;
        (router as any).dismiss();
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          dismissingRef.current = false;
          try {
            const pop = current?.split("/").pop() || "";
            const winPath = typeof window !== "undefined" ? window.location.pathname : "";
            const stillOnSame = !!current && winPath === current;
            const stillOnModalExact = !!pop && winPath.endsWith("/" + pop);
            if (stillOnSame || stillOnModalExact) {
              if (router.canGoBack()) router.back();
              else router.replace(fallbackRoute as any);
            }
          } catch {}
        }, 250);
        return;
      }
      if (router.canGoBack()) {
        router.back();
        return;
      }
    } catch {}
    try {
      if (router.canGoBack()) router.back();
      else router.replace(fallbackRoute as any);
    } catch {
      try { router.back(); } catch {}
    }
  };

  return (
    <TouchableOpacity
      onPress={handleBack}
      style={[styles.button, style]}
      activeOpacity={0.7}
    >
      <CaretLeft size={verticalScale(size)} color={color} weight={weight} />
    </TouchableOpacity>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.neutral600,
    alignSelf: "flex-start",
    borderRadius: radius._12,
    borderCurve: "continuous",
    padding: 5,
  },
});
