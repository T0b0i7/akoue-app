import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/**
 * Fond "blobs" ondulants réutilisable sur les écrans d'auth.
 * Deux taches (bleue / verte) qui font un va-et-vient (ping-pong) tout en
 * se déformant (morphing organique). Le parent doit être position: relative.
 */
type Props = {
  /** Amplitude du mouvement (1 = normal, 1.6 = plus ample). */
  intensity?: number;
};

export default function AnimatedOrbs({ intensity = 1 }: Props) {
  const drift = useSharedValue(0); // va-et-vient (translation / rotation)
  const morph = useSharedValue(0); // ondulation de la forme (corner radius)

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true, // reverse = aller-retour
    );
    morph.value = withRepeat(
      withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(drift);
      cancelAnimation(morph);
    };
  }, []);

  const orbBlueStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: 28 * intensity * drift.value },
      { translateY: 22 * intensity * drift.value },
      { rotate: `${14 * drift.value}deg` },
      { scale: 1 + 0.1 * morph.value },
    ],
    borderTopLeftRadius: 105 + 22 * morph.value,
    borderTopRightRadius: 128 - 22 * morph.value,
    borderBottomRightRadius: 105 + 22 * morph.value,
    borderBottomLeftRadius: 128 - 22 * morph.value,
    opacity: 0.85 + 0.15 * morph.value,
  }));

  const orbGreenStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -30 * intensity * drift.value },
      { translateY: -18 * intensity * drift.value },
      { rotate: `${-16 * drift.value}deg` },
      { scale: 1 + 0.12 * (1 - morph.value) },
    ],
    borderTopLeftRadius: 95 + 20 * morph.value,
    borderTopRightRadius: 118 - 20 * morph.value,
    borderBottomRightRadius: 95 + 20 * morph.value,
    borderBottomLeftRadius: 118 - 20 * morph.value,
    opacity: 0.8 + 0.2 * (1 - morph.value),
  }));

  return (
    <>
      <Animated.View style={[styles.orbBlue, orbBlueStyle]} />
      <Animated.View style={[styles.orbGreen, orbGreenStyle]} />
    </>
  );
}

const styles = StyleSheet.create({
  orbBlue: {
    position: "absolute",
    pointerEvents: "none",
    top: -90,
    right: -70,
    width: 260,
    height: 260,
    backgroundColor: "rgba(10,92,255,0.25)",
  },
  orbGreen: {
    position: "absolute",
    pointerEvents: "none",
    bottom: -80,
    left: -70,
    width: 240,
    height: 240,
    backgroundColor: "rgba(34,197,94,0.14)",
  },
});
