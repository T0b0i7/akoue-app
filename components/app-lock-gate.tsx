import React, { useState } from "react";
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import * as Icons from "phosphor-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as bcrypt from "bcryptjs";
import Typo from "@/components/typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { PatternPad, PinPad } from "@/components/lock-setup-ui";
import { supabase, isSupabaseConfigured } from "@/config/supabase";
import { useAuth } from "@/context/auth-context";
import type { LockMethod } from "@/services/app-lock-service";

type Props = {
  locked: boolean;
  method: LockMethod;
  lockoutSecs: number;
  onUnlockBiometric: () => Promise<{ success: boolean; error?: string }>;
  onUnlockSecret: (secret: string) => Promise<{ ok: boolean; error?: string }>;
  onReset: () => Promise<void>;
};

export default function AppLockGate(p: Props) {
  const { user } = useAuth();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pwd, setPwd] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [recPwd, setRecPwd] = useState("");
  const [recBusy, setRecBusy] = useState(false);
  const [recErr, setRecErr] = useState<string | null>(null);

  const bio = async () => {
    if (p.lockoutSecs > 0) return;
    setBusy(true); setErr(null);
    const r = await p.onUnlockBiometric();
    if (!r.success) setErr(r.error || "Échec reconnaissance.");
    setBusy(false);
  };

  const secret = async (s: string) => {
    if (p.lockoutSecs > 0) return;
    setBusy(true); setErr(null);
    const r = await p.onUnlockSecret(s);
    if (!r.ok) setErr(r.error || "Code incorrect.");
    else setPwd("");
    setBusy(false);
  };

  // Schéma/PIN/mot de passe oublié : prouve ton compte puis choisis un nouveau verrou
  const recover = async () => {
    if (!user?.email) { setRecErr("Reconnecte toi pour réinitialiser."); return; }
    if (!recPwd) { setRecErr("Entre ton mot de passe de compte."); return; }
    setRecBusy(true); setRecErr(null);
    try {
      let ok = false;
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: recPwd });
        ok = !error;
      }
      if (!ok) {
        const raw = await AsyncStorage.getItem("offline_users");
        const users = raw ? JSON.parse(raw) : [];
        const found = users.find((u: any) => u.email?.toLowerCase() === user.email?.toLowerCase());
        const hash = found?.passwordHash || found?.password;
        if (hash) {
          ok = hash.startsWith("$2") ? await bcrypt.compare(recPwd, hash) : recPwd === hash;
        }
      }
      if (!ok) { setRecErr("Mot de passe de compte incorrect."); setRecBusy(false); return; }
      setRecPwd("");
      setShowRecovery(false);
      await p.onReset(); // efface le verrou, la page de choix revient
    } catch (e: any) {
      setRecErr(e?.message || "Échec de vérification.");
    } finally {
      setRecBusy(false);
    }
  };

  return (
    <Modal visible={p.locked} animationType="fade" transparent={false}>
      <View style={styles.root}>
        <View style={styles.avatar}><Icons.FaceMask size={44} color="#fff" weight="fill" /></View>
        <Typo size={24} fontWeight="800" style={{ textAlign: "center" }}>Akouè verrouillé</Typo>
        <Typo size={13} color={colors.neutral400} style={{ textAlign: "center", marginTop: 6 }}>
          {p.method === "biometric" ? "Montre ton visage / pose ton doigt." : p.method === "pin" ? "Entre ton PIN." : p.method === "password" ? "Entre ton mot de passe." : "Trace ton schéma."}
        </Typo>
        {err && <Typo size={13} color={colors.rose} style={{ textAlign: "center", marginTop: 10 }}>{err}</Typo>}
        {p.lockoutSecs > 0 && (
          <View style={styles.lockout}>
            <Icons.Timer size={18} color={colors.rose} weight="fill" />
            <Typo size={14} fontWeight="700" color={colors.rose}>Pause {p.lockoutSecs}s. Trop d'essais</Typo>
          </View>
        )}
        <View style={{ marginTop: 18, width: "100%", alignItems: "center" }}>
          {p.method === "biometric" && (
            <TouchableOpacity style={styles.btn} onPress={bio} disabled={busy} activeOpacity={0.85}>
              <Icons.FaceMask size={20} color="#fff" weight="fill" />
              <Typo size={16} fontWeight="700" color={colors.white}>{busy ? "…" : "Déverrouiller"}</Typo>
            </TouchableOpacity>
          )}
          {p.method === "pin" && <PinPad onDone={secret} />}
          {p.method === "password" && (
            <View style={{ width: "100%", gap: 10 }}>
              <TextInput
                value={pwd} onChangeText={setPwd} secureTextEntry placeholder="Mot de passe"
                placeholderTextColor={colors.neutral500} style={styles.input}
                onSubmitEditing={() => secret(pwd)}
              />
              <TouchableOpacity style={styles.btn} onPress={() => secret(pwd)} disabled={busy}>
                <Typo size={15} fontWeight="700" color={colors.white}>Déverrouiller</Typo>
              </TouchableOpacity>
            </View>
          )}
          {p.method === "pattern" && <PatternPad onDone={secret} />}
        </View>
        {p.method !== "biometric" && !showRecovery && (
          <TouchableOpacity onPress={() => { setShowRecovery(true); setRecErr(null); }} style={{ marginTop: 14 }} activeOpacity={0.7}>
            <Typo size={13} color={colors.primary}>Code oublié ?</Typo>
          </TouchableOpacity>
        )}
        {showRecovery && (
          <View style={{ width: "100%", marginTop: 14, gap: 10 }}>
            <Typo size={13} color={colors.neutral400} style={{ textAlign: "center" }}>
              Prouve ton compte ({user?.email}) puis choisis un nouveau verrou.
            </Typo>
            <TextInput
              value={recPwd} onChangeText={setRecPwd} secureTextEntry
              placeholder="Mot de passe du compte" placeholderTextColor={colors.neutral500}
              style={styles.input} onSubmitEditing={recover}
            />
            {recErr && <Typo size={13} color={colors.rose} style={{ textAlign: "center" }}>{recErr}</Typo>}
            <TouchableOpacity style={styles.btn} onPress={recover} disabled={recBusy} activeOpacity={0.85}>
              <Typo size={15} fontWeight="700" color={colors.white}>{recBusy ? "…" : "Vérifier et réinitialiser"}</Typo>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowRecovery(false)} style={{ alignItems: "center", padding: 6 }} activeOpacity={0.7}>
              <Typo size={13} color={colors.neutral400}>Retour</Typo>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0b0e", alignItems: "center", justifyContent: "center", paddingHorizontal: spacingX._25 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#7A4DFF", alignItems: "center", justifyContent: "center", marginBottom: verticalScale(18) },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#7A4DFF", borderRadius: radius._15, paddingVertical: spacingY._12, paddingHorizontal: spacingX._20, marginTop: 6, minWidth: 220 },
  input: { backgroundColor: colors.neutral800, borderRadius: 12, padding: 12, color: colors.white, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  lockout: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, backgroundColor: "rgba(244,63,94,0.12)", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14 },
});
