import React from "react";
import { StatusBar, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/theme-context";

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, style }) => {
  const { colors, isDark } = useTheme();
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.neutral900 }, style]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.neutral900}
        translucent
      />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenWrapper;
