import React, { useEffect, useRef, useState } from "react";
import { Modal, PanResponder, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import * as Icons from "phosphor-react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import Typo from "@/components/typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { requestCameraForFace } from "@/services/face-lock-service";
import { LOCK_METHODS, type LockMethod } from "@/services/app-lock-service";

type Props = {
  locked: boolean;
  method: LockMethod;
  showEnroll: boolean;
  setupFor: LockMethod | null;
  faceAvailable: boolean;
  onUnlockBiometric: () => Promise<{ success: boolean; error?: string }>;
  onUnlockSecret: (secret: string) => Promise<boolean>;
  onChoose: (m: LockMethod, secret?: string) => Promise<{ success: boolean; error?: string }>;
};

const METHOD_STYLE: Record<LockMethod, { icon: any; tint: string; title: string; desc: string }> = {
  none: { icon: Icons.LockOpen, tint: "#525252", title: "Aucun", desc: "Ouverture directe" },
  biometric: { icon: Icons.Fingerprint, tint: "#7A4DFF", title: "Visage / Empreinte", desc: "Un geste, rien stocké — recommandé" },
  pin: { icon: Icons.Hash, tint: "#0ea5e9", title: "PIN", desc: "4 à 6 chiffres" },
  password: { icon: Icons.Key, tint: "#f59e0b", title: "Mot de passe", desc: "8 caractères minimum" },
  pattern: { icon: Icons.GridNine, tint: "#10b981", title: "Schéma", desc: "Glisse le doigt sur les points" },
};

export function LockMethodCards({
  methods,
  selected,
  onPick,
}: {
  methods: LockMethod[];
  selected: LockMethod | null;
  onPick: (m: LockMethod) => void;
}) {
  return (
    <View style={{ width: "100%", gap: 8 }}>
      {methods.map((m) => {
        const s = METHOD_STYLE[m];
        const Icon = s.icon;
        const on = selected === m;
        return (
          <TouchableOpacity
            key={m}
            style={[styles.mCard, on && styles.mCardOn]}
            onPress={() => onPick(m)}
            activeOpacity={0.8}
          >
            <View style={[styles.mIcon, { backgroundColor: s.tint }]}>
              <Icon size={20} color="#fff" weight="fill" />
            </View>
            <View style={{ flex: 1 }}>
              <Typo size={14} fontWeight="700" color={colors.white}>{s.title}</Typo>
              <Typo size={11} color={colors.neutral400}>{s.desc}</Typo>
            </View>
            {on ? (
              <Icons.CheckCircle size={22} color="#7A4DFF" weight="fill" />
            ) : (
              <Icons.CaretRight size={18} color={colors.neutral500} weight="bold" />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Vrai schéma façon Android : on GLISSE le doigt sur les points, sans tirets.
// Séquence stockée "2573" (jamais affichée avec des tirets).
const PAT_SIZE = 216;
const PAT_CELL = PAT_SIZE / 3;
const patCenter = (i: number) => ({
  x: (i % 3) * PAT_CELL + PAT_CELL / 2,
  y: Math.floor(i / 3) * PAT_CELL + PAT_CELL / 2,
});

function PatternPad({ onDone }: { onDone: (seq: string) => void }) {
  const [seq, setSeq] = useState<number[]>([]);
  const [cur, setCur] = useState<{ x: number; y: number } | null>(null);
  const seqRef = useRef<number[]>([]);
  seqRef.current = seq;

  const addPoint = (x: number, y: number) => {
    const cx = Math.max(0, Math.min(PAT_SIZE - 1, x));
    const cy = Math.max(0, Math.min(PAT_SIZE - 1, y));
    setCur({ x: cx, y: cy });
    const col = Math.floor(cx / PAT_CELL);
    const row = Math.floor(cy / PAT_CELL);
    const idx = row * 3 + col;
    if (!seqRef.current.includes(idx)) {
      const next = [...seqRef.current, idx];
      seqRef.current = next;
      setSeq(next);
    }
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => addPoint(e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderMove: (e) => addPoint(e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderRelease: () => {
        setCur(null);
        if (seqRef.current.length >= 4) onDone(seqRef.current.join(""));
      },
    })
  ).current;

  const points = [...seq.map((i) => patCenter(i)), ...(cur && seq.length ? [cur] : [])]
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  return (
    <View style={{ gap: 10, alignItems: "center" }}>
      <Typo size={12} color={colors.neutral400}>Glisse ton doigt sur au moins 4 points</Typo>
      <View style={{ width: PAT_SIZE, height: PAT_SIZE }} {...pan.panHandlers}>
        <Svg width={PAT_SIZE} height={PAT_SIZE} style={StyleSheet.absoluteFill}>
          {seq.length > 0 && (
            <Polyline points={points} fill="none" stroke="#7A4DFF" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          )}
          {Array.from({ length: 9 }).map((_, i) => {
            const c = patCenter(i);
            const on = seq.includes(i);
            return <Circle key={i} cx={c.x} cy={c.y} r={on ? 15 : 10} fill={on ? "#7A4DFF" : "#3a3a3a"} stroke={on ? "#fff" : "#555"} strokeWidth={1.5} />;
          })}
        </Svg>
        <View style={StyleSheet.absoluteFill} pointerEvents="none" />
      </View>
      <TouchableOpacity onPress={() => { seqRef.current = []; setSeq([]); }}>
        <Typo size={12} color={colors.neutral400}>Recommencer ({seq.length}/9)</Typo>
      </TouchableOpacity>
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

  // Pré-sélection quand l'écran s'ouvre depuis Paramètres
  const firstOpen = useRef(true);
  useEffect(() => {
    if (p.showEnroll) {
      setSetupMethod(p.setupFor);
      setErr(null);
      setPwd("");
      setSetupSecret("");
      firstOpen.current = false;
    }
  }, [p.showEnroll]);

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
              <LockMethodCards
                methods={["biometric", "pin", "password", "pattern"]}
                selected={setupMethod}
                onPick={(m) => { setSetupMethod(m); setErr(null); if (m === "biometric") enroll(m); }}
              />
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
  mCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.neutral800, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  mCardOn: { borderColor: "#7A4DFF", backgroundColor: "rgba(122,77,255,0.12)" },
  mIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
