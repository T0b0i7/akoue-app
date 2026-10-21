import { dismissPwaInstallPrompt, getPwaInstallPromptState } from "@/services/pwa-install";
import type { UserType } from "@/types";
import { useLocale } from "@/context/locale-context";
import React, { useCallback, useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import Typo from "@/components/typo";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

declare global {
  interface Window {
    __akoueInstallPrompt?: InstallPromptEvent | null;
  }
}

export default function PwaInstallPrompt({ user }: { user: UserType }) {
  const email = user?.email?.trim().toLowerCase() ?? "";
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);
  const [installAvailable, setInstallAvailable] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const close = useCallback(async () => {
    if (email) await dismissPwaInstallPrompt(email);
    setVisible(false);
  }, [email]);

  useEffect(() => {
    if (Platform.OS !== "web" || !email) return;
    let active = true;

    const checkInstallState = () => {
      const installed =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (installed) {
        void close();
        return;
      }
      setInstallAvailable(Boolean(window.__akoueInstallPrompt));
    };

    const showAfterSignup = async () => {
      try {
        const state = await getPwaInstallPromptState(email);
        if (active && state.pending && !state.dismissed) setVisible(true);
      } catch (error) {
        console.warn("[pwa] Impossible de lire l'état de l'invitation :", error);
      }
    };

    checkInstallState();
    void showAfterSignup();
    window.addEventListener("akoue-install-available", checkInstallState);
    window.addEventListener("appinstalled", close);
    return () => {
      active = false;
      window.removeEventListener("akoue-install-available", checkInstallState);
      window.removeEventListener("appinstalled", close);
    };
  }, [close, email]);

  const install = async () => {
    const prompt = window.__akoueInstallPrompt;
    if (!prompt) {
      setShowInstructions(true);
      return;
    }
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      window.__akoueInstallPrompt = null;
      setInstallAvailable(false);
      if (choice.outcome === "accepted") await close();
      else setShowInstructions(true);
    } catch (error) {
      console.warn("[pwa] Le navigateur n'a pas pu ouvrir l'installation :", error);
      setShowInstructions(true);
    }
  };

  const isIosSafari = Platform.OS === "web" && typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const instructions = isIosSafari ? t("installAppIosInstructions") : t("installAppBrowserInstructions");

  if (Platform.OS !== "web" || !visible) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Typo size={21} fontWeight="800" color="#fff" style={styles.title}>
            {t("installAppTitle")}
          </Typo>
          <Typo size={14} color="#c4c4cc" style={styles.description}>
            {showInstructions
              ? instructions
              : t("installAppDescription")}
          </Typo>
          {installAvailable && !showInstructions ? (
            <Pressable onPress={install} style={styles.primaryButton}>
              <Typo size={15} fontWeight="700" color="#fff">{t("installAppButton")}</Typo>
            </Pressable>
          ) : null}
          <Pressable onPress={showInstructions ? close : () => setShowInstructions(true)} style={styles.secondaryButton}>
            <Typo size={14} fontWeight="700" color="#fff">
              {showInstructions ? t("installAppUnderstood") : t("installAppManual")}
            </Typo>
          </Pressable>
          <Pressable onPress={close} accessibilityRole="button" style={styles.laterButton}>
            <Typo size={13} color="#a3a3a3">{t("installAppLater")}</Typo>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#111827",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  title: { textAlign: "center" },
  description: { textAlign: "center", lineHeight: 21 },
  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#7A4DFF",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  laterButton: { alignItems: "center", paddingVertical: 4 },
});
