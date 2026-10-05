import BackButton from "@/components/back-button";
import Header from "@/components/header";
import ScreenWrapper from "@/components/screen-wrapper";
import Typo from "@/components/typo";
import { LockMethodCards, PatternPad, PinPad } from "@/components/lock-setup-ui";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { markEnrollDone, setAppLock, type LockMethod } from "@/services/app-lock-service";
import { authenticateWithFace, requestCameraForFace } from "@/services/face-lock-service";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View, ScrollView } from "react-native";

// Page plein écran : choix + application du verrou (plus de bottom-sheet).
export default function AppLockSetup() {
  const router = useRouter();
  const params = useLocalSearchParams<{ method?: string }>();
  const initial = (params.method as LockMethod) || null;
  const [picked, setPicked] = useState<LockMethod | null>(initial);
  const [secret, setSecret] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const finish = async () => {
    await markEnrollDone();
    setDone(true);
  };

  const enrollBiometric = async () => {
    setBusy(true); setErr(null);
    const cam = await requestCameraForFace();
    if (!cam) { setErr("Autorise l'accès à la caméra pour Face Unlock."); setBusy(false); return; }
    const r = await authenticateWithFace("Confirme ton visage pour activer le verrouillage");
    if (!r.success) { setErr(r.error || "Enrôlement annulé."); setBusy(false); return; }
    const s = await setAppLock("biometric");
    if (!s.success) { setErr(s.msg || "Échec."); setBusy(false); return; }
    setBusy(false);
    await finish();
  };

  const enrollSecret = async (m: LockMethod, s: string) => {
    setBusy(true); setErr(null);
    const r = await setAppLock(m, s);
    if (!r.success) { setErr(r.msg || "Échec."); setBusy(false); return; }
    setSecret("");
    setPwd("");
    setBusy(false);
    await finish();
  };

  const pick = (m: LockMethod) => {
    setPicked(m);
    setErr(null);
    setSecret("");
    setPwd("");
    if (m === "biometric") enrollBiometric();
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <Header title="Verrouillage" leftIcon={<BackButton />} style={{ marginBottom: spacingY._10 }} />

        {!done ? (
          <>
            <View style={styles.hero}>
              <View style={styles.avatar}>
                <Icons.ShieldCheck size={30} color="#fff" weight="fill" />
              </View>
              <Typo size={20} fontWeight="800" style={{ textAlign: "center" }}>Choisis ton verrou</Typo>
              <Typo size={13} color={colors.neutral400} style={{ textAlign: "center", marginTop: 8, lineHeight: 19 }}>
                Obligatoire pour protéger ton argent : choisis une manière de verrouiller.{"\n"}
                Elle restera active — changeable dans Paramètres › Verrouillage.
              </Typo>
            </View>

            {err && <Typo size={13} color={colors.rose} style={{ textAlign: "center", marginVertical: 8 }}>{err}</Typo>}

            <LockMethodCards
              methods={["biometric", "pin", "password", "pattern"]}
              selected={picked}
              onPick={pick}
            />

            <View style={{ marginTop: 16, alignItems: "center" }}>
              {picked === "pin" && <PinPad onDone={(v) => enrollSecret("pin", v)} />}
              {picked === "password" && (
                <View style={{ width: "100%", gap: 10 }}>
                  <TextInput
                    value={pwd} onChangeText={setPwd} secureTextEntry
                    placeholder="Nouveau mot de passe (8+)" placeholderTextColor={colors.neutral500}
                    style={styles.input}
                  />
                  <TouchableOpacity style={styles.btn} disabled={busy} onPress={() => enrollSecret("password", pwd)} activeOpacity={0.85}>
                    <Typo size={15} fontWeight="700" color={colors.white}>{busy ? "…" : "Enregistrer"}</Typo>
                  </TouchableOpacity>
                </View>
              )}
              {picked === "pattern" && <PatternPad onDone={(v) => enrollSecret("pattern", v)} />}
            </View>
          </>
        ) : (
          <View style={styles.hero}>
            <View style={[styles.avatar, { backgroundColor: "#10b981" }]}>
              <Icons.CheckCircle size={30} color="#fff" weight="fill" />
            </View>
            <Typo size={20} fontWeight="800" style={{ textAlign: "center" }}>Verrou appliqué ✓</Typo>
            <Typo size={13} color={colors.neutral400} style={{ textAlign: "center", marginTop: 8 }}>
              Ton argent est protégé. Ce verrou s'appliquera à chaque ouverture.
            </Typo>
            <TouchableOpacity style={styles.btn} onPress={() => router.replace("/" as any)} activeOpacity={0.85}>
              <Typo size={15} fontWeight="700" color={colors.white}>Continuer</Typo>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: spacingX._20, paddingBottom: verticalScale(30) },
  hero: { alignItems: "center", marginVertical: verticalScale(14) },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#7A4DFF", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#7A4DFF", borderRadius: 14, paddingVertical: spacingY._12, paddingHorizontal: spacingX._20, marginTop: 16, minWidth: 220 },
  input: { backgroundColor: colors.neutral800, borderRadius: 12, padding: 12, color: colors.white, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
});
