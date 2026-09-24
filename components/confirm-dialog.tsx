import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Typo from "@/components/typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: destructive ? colors.rose : colors.primary }]}>
              <Typo size={20} fontWeight="800" color="#fff">
                !
              </Typo>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Typo size={17} fontWeight="700" color={colors.white}>
                {title}
              </Typo>
              <Typo size={13} color={colors.neutral400} style={{ lineHeight: 18 }}>
                {message}
              </Typo>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={[styles.btn, styles.btnCancel]}>
              <Typo size={15} fontWeight="600" color={colors.neutral200}>
                {cancelLabel}
              </Typo>
            </Pressable>
            <Pressable onPress={onConfirm} style={[styles.btn, destructive ? styles.btnDestructive : styles.btnPrimary]}>
              <Typo size={15} fontWeight="700" color="#fff">
                {confirmLabel}
              </Typo>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.neutral800,
    borderRadius: radius._15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: spacingX._20,
    gap: spacingY._15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    gap: spacingX._12,
    alignItems: "flex-start",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: spacingX._12,
    justifyContent: "flex-end",
    marginTop: verticalScale(4),
  },
  btn: {
    flex: 1,
    paddingVertical: verticalScale(12),
    borderRadius: radius._12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancel: {
    backgroundColor: colors.neutral700,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  btnDestructive: {
    backgroundColor: colors.rose,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
});
