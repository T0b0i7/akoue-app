import React from "react";
import { StyleSheet, TouchableOpacity, View, ScrollView } from "react-native";
import Typo from "./typo";
import { colors, radius } from "@/constants/theme";
import { verticalScale, scale } from "@/utils/styling";
import { WALLET_ICONS, WALLET_COLORS } from "@/constants/wallet-icons";

type Props = {
  selectedId: string;
  selectedColor: string;
  onSelectId: (id: string) => void;
  onSelectColor: (color: string) => void;
};

export default function IconPicker({ selectedId, selectedColor, onSelectId, onSelectColor }: Props) {
  return (
    <View style={styles.wrap}>
      <Typo size={13} color={colors.neutral400} style={{ marginBottom: 8 }}>Icône</Typo>
      <View style={styles.grid}>
        {WALLET_ICONS.map((def) => {
          const IconComp: any = def.icon;
          const isSelected = def.id === selectedId;
          return (
            <TouchableOpacity
              key={def.id}
              onPress={() => onSelectId(def.id)}
              style={[
                styles.cell,
                { backgroundColor: isSelected ? selectedColor : colors.neutral800, borderColor: isSelected ? selectedColor : colors.neutral600 },
              ]}
            >
              <IconComp size={verticalScale(20)} color={isSelected ? colors.white : colors.neutral200} weight={isSelected ? "fill" : "regular"} />
            </TouchableOpacity>
          );
        })}
      </View>

      <Typo size={13} color={colors.neutral400} style={{ marginTop: 14, marginBottom: 8 }}>Couleur</Typo>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
        {WALLET_COLORS.map((c) => {
          const isActive = c === selectedColor;
          return (
            <TouchableOpacity
              key={c}
              onPress={() => onSelectColor(c)}
              style={[
                styles.colorDot,
                { backgroundColor: c, borderColor: isActive ? colors.white : "transparent" },
              ]}
            />
          );
        })}
      </ScrollView>

      <View style={[styles.preview, { backgroundColor: selectedColor }]}>
        {(() => {
          const def = WALLET_ICONS.find((w) => w.id === selectedId) || WALLET_ICONS[0];
          const IconComp: any = def.icon;
          return <IconComp size={verticalScale(28)} color={colors.white} weight="fill" />;
        })()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cell: {
    width: scale(44),
    height: scale(44),
    borderRadius: radius._12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 4,
  },
  colorDot: {
    width: scale(32),
    height: scale(32),
    borderRadius: 16,
    borderWidth: 2,
  },
  preview: {
    marginTop: 14,
    alignSelf: "center",
    width: verticalScale(64),
    height: verticalScale(64),
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
