import React, { useRef, useState } from "react";
import { PanResponder, StyleSheet, TouchableOpacity, View } from "react-native";
import * as Icons from "phosphor-react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import Typo from "@/components/typo";
import { colors, radius } from "@/constants/theme";
import type { LockMethod } from "@/services/app-lock-service";

// ---------- Cartes de choix (joli design accompagné) ----------

const METHOD_STYLE: Record<LockMethod, { icon: any; tint: string; title: string; desc: string }> = {
  none: { icon: Icons.LockOpen, tint: "#525252", title: "Aucun", desc: "Ouverture directe" },
  biometric: { icon: Icons.Fingerprint, tint: "#7A4DFF", title: "Visage / Empreinte", desc: "Un geste, rien stocké. Recommandé" },
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

// ---------- Clavier PIN ----------

export function PinPad({ onDone }: { onDone: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  const press = (d: string) => {
    const next = (pin + d).slice(0, 6);
    setPin(next);
    if (next.length >= 4) onDone(next);
  };
  return (
    <View style={{ alignItems: "center", gap: 12 }}>
      <Typo size={26} fontWeight="800" style={{ letterSpacing: 6 }}>{"•".repeat(pin.length) + "○".repeat(Math.max(0, 4 - pin.length))}</Typo>
      <View style={styles.pinGrid}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "OK"].map((k) => (
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

// ---------- Vrai schéma façon Android : on GLISSE le doigt, sans tirets ----------

const PAT_SIZE = 216;
const PAT_CELL = PAT_SIZE / 3;
const patCenter = (i: number) => ({
  x: (i % 3) * PAT_CELL + PAT_CELL / 2,
  y: Math.floor(i / 3) * PAT_CELL + PAT_CELL / 2,
});

export function PatternPad({ onDone }: { onDone: (seq: string) => void }) {
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
      </View>
      <TouchableOpacity onPress={() => { seqRef.current = []; setSeq([]); }}>
        <Typo size={12} color={colors.neutral400}>Recommencer ({seq.length}/9)</Typo>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.neutral800, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  mCardOn: { borderColor: "#7A4DFF", backgroundColor: "rgba(122,77,255,0.12)" },
  mIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  pinGrid: { flexDirection: "row", flexWrap: "wrap", width: 230, justifyContent: "space-between", gap: 10 },
  pinKey: { width: 68, height: 52, borderRadius: 12, backgroundColor: colors.neutral800, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
});
