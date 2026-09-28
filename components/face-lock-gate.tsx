import React, { useState } from "react";
import { Modal, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import * as Icons from "phosphor-react-native";
import Typo from "@/components/typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { requestCameraForFace } from "@/services/face-lock-service";

type Props = {
  locked: boolean;
  showEnroll: boolean;
  faceAvailable: boolean;
  onUnlock: () => Promise<{ success: boolean; error?: string }>;
  onEnable: () => Promise<{ success: boolean; error?: string }>;
  onDismissEnroll: () => void;
  onDisable?: () => void;
};

export default function FaceLockGate({ locked, showEnroll, faceAvailable, onUnlock, onEnable, onDismissEnroll }: Props) {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const doUnlock = async () => {
    setBusy(true);
    setErr(null);
    const r = await onUnlock();
    if (!r.success) setErr(r.error || "Échec de la reconnaissance.");
    setBusy(false);
  };

  const doEnroll = async () => {
    setBusy(true);
    setErr(null);
    // 1) Permission caméra — touche personnelle : l'app "capture" le visage à la 1re ouverture
    const cam = await requestCameraForFace();
    if (!cam) {
      setErr("Autorise l'accès à la caméra pour activer Face Unlock.");
      setBusy(false);
      return;
    }
    // 2) Enrôlement biométrique natif (FaceID / visage Android) = mot de passe visage
    const r = await onEnable();
    if (!r.success) setErr(r.error || "Enrôlement annulé.");
    setBusy(false);
  };

  return (
    <>
      {/* Écran verrouillé */}
      <Modal visible={locked} animationType="fade" transparent={false}>
        <View style={styles.root}>
          <View style={styles.avatar}>
            <Icons.FaceMask size={44} color={colors.white} weight="fill" />
          </View>
          <Typo size={24} fontWeight="800" style={{ textAlign: "center" }}>Akouè verrouillé</Typo>
          <Typo size={14} color={colors.neutral400} style={{ textAlign: "center", marginTop: 8 }}>
            Montre ton visage pour voir ton argent.
          </Typo>
          {err && (
            <Typo size={13} color={colors.rose} style={{ textAlign: "center", marginTop: 10 }}>{err}</Typo>
          )}
          <TouchableOpacity style={styles.btn} onPress={doUnlock} disabled={busy} activeOpacity={0.85}>
            <Icons.FaceMask size={20} color="#fff" weight="fill" />
            <Typo size={16} fontWeight="700" color={colors.white}>{busy ? "…" : "Déverrouiller avec mon visage"}</Typo>
          </TouchableOpacity>
          {Platform.OS === "web" && (
            <Typo size={12} color={colors.neutral500} style={{ textAlign: "center", marginTop: 12 }}>
              Face Unlock indisponible sur web.
            </Typo>
          )}
        </View>
      </Modal>

      {/* 1re ouverture : proposition personnelle */}
      <Modal visible={!locked && showEnroll} animationType="slide" transparent>
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.avatarSm}>
              <Icons.Sparkle size={26} color="#fff" weight="fill" />
            </View>
            <Typo size={19} fontWeight="800" style={{ textAlign: "center" }}>Ta petite touche perso ?</Typo>
            <Typo size={13} color={colors.neutral400} style={{ textAlign: "center", marginTop: 8, lineHeight: 19 }}>
              Dès la première ouverture, Akouè peut capturer ton visage (avec ta permission caméra) et s'en servir comme mot de passe, façon Face Unlock, à chaque retour dans l'app.
            </Typo>
            {!faceAvailable && (
              <Typo size={12} color={colors.neutral500} style={{ textAlign: "center", marginTop: 8 }}>
                Astuce : configure FaceID / visage dans les réglages système pour un vrai déverrouillage.
              </Typo>
            )}
            {err && (
              <Typo size={13} color={colors.rose} style={{ textAlign: "center", marginTop: 8 }}>{err}</Typo>
            )}
            <TouchableOpacity style={styles.btn} onPress={doEnroll} disabled={busy} activeOpacity={0.85}>
              <Icons.Camera size={18} color="#fff" weight="fill" />
              <Typo size={15} fontWeight="700" color={colors.white}>{busy ? "…" : "Activer Face Unlock"}</Typo>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDismissEnroll} style={styles.later} activeOpacity={0.7}>
              <Typo size={13} color={colors.neutral400}>Plus tard</Typo>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0b0e", alignItems: "center", justifyContent: "center", paddingHorizontal: spacingX._25 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#7A4DFF", alignItems: "center", justifyContent: "center", marginBottom: verticalScale(18) },
  btn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#7A4DFF", borderRadius: radius._15, paddingVertical: spacingY._12, paddingHorizontal: spacingX._20, marginTop: verticalScale(22) },
  sheetWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.neutral900, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacingX._20, paddingBottom: verticalScale(34), alignItems: "center" },
  avatarSm: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#7A4DFF", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  later: { marginTop: 14, padding: 8 },
});
