import React, { useState } from "react";
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import * as Icons from "phosphor-react-native";
import Typo from "@/components/typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { requestCameraForFace } from "@/services/face-lock-service";
import type { LockMethod } from "@/services/app-lock-service";

type Props = {
  locked: boolean;
  method: LockMethod;
  showEnroll: boolean;
  faceAvailable: boolean;
  onUnlockBiometric: () => Promise<{ success: boolean; error?: string }>;
  onUnlockSecret: (secret: string) => Promise<boolean>;
  onChoose: (m: LockMethod, secret?: string) => Promise<{ success: boolean; error?: string }>;
};

function PatternPad({ onDone }: { onDone: (seq: string) => void }) {
  const [seq, setSeq] = useState<number[]>([]);
  const tap = (i: number) => {
    if (seq.includes(i)) return;
    const next = [...seq, i];
    setSeq(next);
    if (next.length >= 4) onDone(next.join("-"));
  };
  return (
    <View style={{ gap: 10, alignItems: "center" }}>
      <View style={styles.grid}>
        {Array.from({ length: 9 }).map((_, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.dot, seq.includes(i) && styles.dotOn]}
            onPress={() => tap(i)}
            activeOpacity={0.7}
          >
            {seq.includes(i) && <Typo size={11} fontWeight="800" color="#fff">{seq.indexOf(i) + 1}</Typo>}
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={() => setSeq([])}><Typo size={12} color={colors.neutral400}>Recommencer ({seq.length}/9)</Typo></TouchableOpacity>
    </View>
  );
}

function PinPad({ onDone }: { onDone: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  const press = (d: string) => {
    const next = (pin + d).slice(0, 6);
    setPin(next);
    if (next.length >= 4) onDone(next);
  };
  return (
    <View style={{ alignItems: "center", gap: 12 }}>
      <Typo size={26} fontWeight="800" style={{ letterSpacing: 6 }}>{"•".repeat(pin.length) || "––––"}</Typo>
      <View style={styles.pinGrid}>
        {["1","2","3","4","5","6","7","8","9","⌫","0","OK"].map((k) => (
          <TouchableOpacity
            key={k}
            style={styles.pinKey}
            onPress={() => {
              if (k === "⌫") setPin(pin.slice(0, -1));
              else if (k === "OK") { if (pin.length >= 4) onDone(pin); }
              else press(k);
            }}
          >
            <Typo size={18} fontWeight="700">{k}</Typo>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function AppLockGate(p: Props) {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pwd, setPwd] = useState("");
  const [setupMethod, setSetupMethod] = useState<LockMethod | null>(null);
  const [setupSecret, setSetupSecret] = useState("");

  const bio = async () => {
    setBusy(true); setErr(null);
    const r = await p.onUnlockBiometric();
    if (!r.success) setErr(r.error || "Échec reconnaissance.");
    setBusy(false);
  };

  const secret = async (s: string) => {
    setBusy(true); setErr(null);
    const ok = await p.onUnlockSecret(s);
    if (!ok) setErr("Code incorrect.");
    setBusy(false);
  };

  const enroll = async (m: LockMethod, s?: string) => {
    setBusy(true); setErr(null);
    if (m === "biometric") {
      const cam = await requestCameraForFace();
      if (!cam) { setErr("Autorise la caméra pour Face Unlock."); setBusy(false); return; }
    }
    const r = await p.onChoose(m, s);
    if (!r.success) setErr(r.error || "Échec.");
    else { setSetupMethod(null); setSetupSecret(""); setPwd(""); }
    setBusy(false);
  };

  const renderUnlock = () => {
    if (p.method === "biometric") {
      return (
        <TouchableOpacity style={styles.btn} onPress={bio} disabled={busy} activeOpacity={0.85}>
          <Icons.FaceMask size={20} color="#fff" weight="fill" />
          <Typo size={16} fontWeight="700" color={colors.white}>{busy ? "…" : "Déverrouiller"}</Typo>
        </TouchableOpacity>
      );
    }
    if (p.method === "pin") return <PinPad onDone={secret} />;
    if (p.method === "password") {
      return (
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
      );
    }
    if (p.method === "pattern") return <PatternPad onDone={secret} />;
    return null;
  };

  const renderSetup = () => {
    if (!setupMethod || setupMethod === "none" || setupMethod === "biometric") return null;
    if (setupMethod === "pin") return <PinPad onDone={(v) => { setSetupSecret(v); enroll("pin", v); }} />;
    if (setupMethod === "password") {
      return (
        <View style={{ width: "100%", gap: 10 }}>
          <TextInput
            value={setupSecret} onChangeText={setSetupSecret} secureTextEntry placeholder="Nouveau mot de passe (8+)"
            placeholderTextColor={colors.neutral500} style={styles.input}
          />
          <TouchableOpacity style={styles.btn} onPress={() => enroll("password", setupSecret)} disabled={busy}>
            <Typo size={15} fontWeight="700" color={colors.white}>Enregistrer</Typo>
          </TouchableOpacity>
        </View>
      );
    }
    return <PatternPad onDone={(v) => { setSetupSecret(v); enroll("pattern", v); }} />;
  };

  return (
    <>
      <Modal visible={p.locked} animationType="fade" transparent={false}>
        <View style={styles.root}>
          <View style={styles.avatar}><Icons.FaceMask size={44} color="#fff" weight="fill" /></View>
          <Typo size={24} fontWeight="800" style={{ textAlign: "center" }}>Akouè verrouillé</Typo>
          <Typo size={13} color={colors.neutral400} style={{ textAlign: "center", marginTop: 6 }}>
            {p.method === "biometric" ? "Montre ton visage / pose ton doigt." : p.method === "pin" ? "Entre ton PIN." : p.method === "password" ? "Entre ton mot de passe." : "Trace ton schéma."}
          </Typo>
          {err && <Typo size={13} color={colors.rose} style={{ textAlign: "center", marginTop: 10 }}>{err}</Typo>}
          <View style={{ marginTop: 18, width: "100%", alignItems: "center" }}>{renderUnlock()}</View>
        </View>
      </Modal>

      <Modal visible={!p.locked && p.showEnroll} animationType="slide" transparent>
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <Typo size={19} fontWeight="800" style={{ textAlign: "center" }}>Choisis ton verrou</Typo>
            <Typo size={13} color={colors.neutral400} style={{ textAlign: "center", marginTop: 8 }}>
              Obligatoire pour protéger ton argent : choisis une manière de verrouiller.{"\n"}
              Elle restera active — tu pourras la changer ou la réinitialiser dans Paramètres › Verrouillage.
            </Typo>
            {!p.faceAvailable && (
              <Typo size={12} color={colors.neutral500} style={{ textAlign: "center", marginTop: 6 }}>
                Configure FaceID / visage / empreinte système pour la biométrie.
              </Typo>
            )}
            {err && <Typo size={13} color={colors.rose} style={{ textAlign: "center", marginTop: 8 }}>{err}</Typo>}
            <View style={{ width: "100%", gap: 8, marginTop: 14 }}>
              {([
                ["biometric", "Visage / Empreinte (recommandé)"],
                ["pin", "PIN 4-6 chiffres"],
                ["password", "Mot de passe"],
                ["pattern", "Schéma"],
              ] as [LockMethod, string][]).map(([m, label]) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.choice, setupMethod === m && styles.choiceOn]}
                  onPress={() => { setSetupMethod(m); setErr(null); if (m === "biometric") enroll(m); }}
                >
                  <Typo size={14} fontWeight="700" color={colors.white}>{label}</Typo>
                </TouchableOpacity>
              ))}
            </View>
            {renderSetup()}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0b0e", alignItems: "center", justifyContent: "center", paddingHorizontal: spacingX._25 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#7A4DFF", alignItems: "center", justifyContent: "center", marginBottom: verticalScale(18) },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#7A4DFF", borderRadius: radius._15, paddingVertical: spacingY._12, paddingHorizontal: spacingX._20, marginTop: 6, minWidth: 220 },
  input: { backgroundColor: colors.neutral800, borderRadius: 12, padding: 12, color: colors.white, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  sheetWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.neutral900, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacingX._20, paddingBottom: verticalScale(34), alignItems: "center", maxHeight: "92%" },
  choice: { backgroundColor: colors.neutral800, borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  choiceOn: { borderColor: "#7A4DFF" },
  later: { marginTop: 14, padding: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", width: 210, justifyContent: "space-between", gap: 12 },
  dot: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.neutral800, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  dotOn: { backgroundColor: "#7A4DFF", borderColor: "#7A4DFF" },
  pinGrid: { flexDirection: "row", flexWrap: "wrap", width: 230, justifyContent: "space-between", gap: 10 },
  pinKey: { width: 68, height: 52, borderRadius: 12, backgroundColor: colors.neutral800, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
});
