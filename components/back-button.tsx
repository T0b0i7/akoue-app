import { useRouter } from "expo-router";
import { CaretLeft } from "phosphor-react-native";
import { StyleSheet, TouchableOpacity } from "react-native";
import { colors, radius } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";

const BackButton = ({
  size = 26,
  color = "white",
  weight = "bold",
  style,
}: any) => {
  const router = useRouter();

  const handleBack = () => {
    try {
      // @ts-ignore dismiss existe en expo-router 3+
      if ((router as any).dismiss) (router as any).dismiss();
      else if (router.canGoBack()) router.back();
      else router.replace("/(tabs)/wallet" as any);
    } catch {
      try { router.back(); } catch { router.replace("/(tabs)/wallet" as any); }
    }
    // fallback si dismiss n'a pas fermé (web)
    setTimeout(() => {
      try { if (router.canGoBack()) router.back(); } catch {}
    }, 300);
  };

  return (
    <TouchableOpacity
      onPress={handleBack}
      style={[styles.button, style]}
      activeOpacity={0.7}
    >
      <CaretLeft size={verticalScale(size)} color={color} weight={weight} />
    </TouchableOpacity>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.neutral600,
    alignSelf: "flex-start",
    borderRadius: radius._12,
    borderCurve: "continuous",
    padding: 5,
  },
});
