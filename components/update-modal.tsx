import React, { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import * as Icons from "phosphor-react-native";
import Typo from "@/components/typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";

export type PendingUpdate = {
  id: string;
  title: string;
  body: string;
  details: string | null;
  url: string;
  label: string;
};

type Props = {
  update: PendingUpdate | null;
  downloading: boolean;
  busy: boolean;
  progress: number | null;
  onUpdate: () => void;
  onLater: () => void;
  onDone: () => void;
};

export default function UpdateModal({ update, downloading, busy, progress, onUpdate, onLater, onDone }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <Modal visible={!!update} animationType="slide" transparent>
      <View style={styles.wrap}>
        <View style={styles.sheet}>
          {!downloading ? (
            <>
              <View style={styles.icon}>
                <Icons.ArrowCircleUp size={30} color="#fff" weight="fill" />
              </View>
              <Typo size={20} fontWeight="800" style={{ textAlign: "center" }}>
                {update?.title || "Mise à jour disponible"}
              </Typo>
              <Typo size={14} color={colors.neutral400} style={{ textAlign: "center", marginTop: 8, lineHeight: 20 }}>
                {update?.body}
              </Typo>
              {update?.details ? (
                <>
                  <TouchableOpacity onPress={() => setShowDetails(!showDetails)} style={styles.later} activeOpacity={0.7}>
                    <Typo size={13} color={colors.primary}>
                      {showDetails ? "Masquer les détails" : "Voir plus : qu'est-ce qui change ?"}
                    </Typo>
                  </TouchableOpacity>
                  {showDetails && (
                    <Typo size={13} color={colors.neutral100} style={{ textAlign: "center", marginTop: 4, lineHeight: 19 }}>
                      {update.details}
                    </Typo>
                  )}
                </>
              ) : null}
              <TouchableOpacity style={styles.btn} onPress={onUpdate} disabled={busy} activeOpacity={0.85}>
                <Icons.DownloadSimple size={18} color="#fff" weight="fill" />
                <Typo size={15} fontWeight="700" color={colors.white}>
                  {busy ? "…" : update?.label || "Mettre à jour"}
                </Typo>
              </TouchableOpacity>
              <TouchableOpacity onPress={onLater} style={styles.later} activeOpacity={0.7}>
                <Typo size={13} color={colors.neutral400}>Plus tard</Typo>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {progress !== null ? (
                <>
                  <Typo size={30} fontWeight="800">{Math.round(progress * 100)}%</Typo>
                  <View style={styles.bar}>
                    <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%` }]} />
                  </View>
                  <Typo size={14} color={colors.neutral400} style={{ textAlign: "center", marginTop: 8 }}>
                    Téléchargement en cours… patiente.
                  </Typo>
                </>
              ) : (
                <>
                  <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 10 }} />
                  <Typo size={19} fontWeight="800" style={{ textAlign: "center" }}>Téléchargement lancé…</Typo>
                </>
              )}
              <Typo size={13} color={colors.neutral400} style={{ textAlign: "center", marginTop: 8, lineHeight: 19 }}>
                Le nouvel APK se télécharge. Patiente, puis installe-le quand Android te le propose.{"\n"}Tu peux quitter cet écran, le téléchargement continue.
              </Typo>
              <View style={styles.steps}>
                <Typo size={12} color={colors.neutral100}>1. Télécharge ✓</Typo>
                <Typo size={12} color={colors.neutral100}>2. Ouvre le fichier APK</Typo>
                <Typo size={12} color={colors.neutral100}>3. Installe par-dessus l'ancienne version</Typo>
              </View>
              <TouchableOpacity style={styles.btn} onPress={onDone} activeOpacity={0.85}>
                <Icons.CheckCircle size={18} color="#fff" weight="fill" />
                <Typo size={15} fontWeight="700" color={colors.white}>J'ai installé la MAJ</Typo>
              </TouchableOpacity>
              <TouchableOpacity onPress={onDone} style={styles.later} activeOpacity={0.7}>
                <Typo size={13} color={colors.neutral400}>Fermer</Typo>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.neutral900, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: spacingX._20, paddingBottom: verticalScale(34), alignItems: "center",
  },
  icon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: "#7A4DFF",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#7A4DFF", borderRadius: radius._15,
    paddingVertical: spacingY._12, paddingHorizontal: spacingX._20, marginTop: verticalScale(18), minWidth: 230,
  },
  later: { marginTop: 12, padding: 8 },
  steps: { marginTop: 14, gap: 4, alignItems: "center" },
  bar: {
    width: "100%", height: 12, borderRadius: 6, backgroundColor: colors.neutral800,
    marginTop: 12, overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: "#7A4DFF", borderRadius: 6 },
});
