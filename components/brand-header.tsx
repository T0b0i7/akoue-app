import React from "react";
import { Image, StyleSheet, View } from "react-native";
import Typo from "./typo";
import { colors } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";

type BrandHeaderProps = {
  compact?: boolean;
  email?: string | null;
};

/**
 * BrandHeader : seule source de verite visuelle du logo.
 * Monogramme mono-akoue.png dans un Double-Bezel synchro
 * splash, login, sign-up, OTP. Ne pas dupliquer le style ailleurs.
 */
const BrandHeader: React.FC<BrandHeaderProps> = ({ compact = false, email }) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.shell}>
        <View style={styles.core}>
          <Image
            source={require("@/public/images/mono-akoue.png")}
            style={compact ? styles.logoSm : styles.logo}
            resizeMode="cover"
          />
        </View>
      </View>
      <View style={styles.texts}>
        <View style={styles.eyebrow}>
          <Typo size={10} color={colors.neutral400} fontWeight="700" style={styles.eyebrowText}>
            MAITRISE TON ARGENT
          </Typo>
        </View>
        <Typo size={compact ? 24 : 30} fontWeight="800" color={colors.white} style={styles.title}>
          Akouè
        </Typo>
        {email ? (
          <Typo size={13} color={colors.neutral400} style={styles.email} textProps={{ numberOfLines: 1 }}>
            {email}
          </Typo>
        ) : (
          <Typo size={14} color={colors.neutral400} style={styles.sub}>
            Reprends le controle de tes finances.
          </Typo>
        )}
      </View>
    </View>
  );
};

export default BrandHeader;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: "100%",
    gap: 14,
  },
  shell: {
    padding: 6,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  core: {
    width: verticalScale(76),
    height: verticalScale(76),
    borderRadius: 24,
    backgroundColor: "#0B1530",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: {
    width: verticalScale(64),
    height: verticalScale(64),
    borderRadius: 14,
  },
  logoSm: {
    width: verticalScale(56),
    height: verticalScale(56),
    borderRadius: 12,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(122,77,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(122,77,255,0.28)",
  },
  eyebrowText: {
    letterSpacing: 2,
  },
  title: {
    letterSpacing: 0.5,
  },
  sub: {
    lineHeight: 19,
  },
  email: {
    lineHeight: 18,
  },
});
