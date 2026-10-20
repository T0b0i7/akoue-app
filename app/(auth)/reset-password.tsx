import { Alert, StyleSheet, View } from "react-native";
import React, { useEffect, useState } from "react";
import ScreenWrapper from "@/components/screen-wrapper";
import Typo from "@/components/typo";
import BrandHeader from "@/components/brand-header";
import AnimatedOrbs from "@/components/animated-orbs";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import Input from "@/components/input";
import { LockIcon as IconLock } from "phosphor-react-native/src/icons/Lock";
import { LockKeyIcon as IconLockKey } from "phosphor-react-native/src/icons/LockKey";
import Button from "@/components/button";
import { useRouter } from "expo-router";
import { useToast } from "@/context/toast-context";
import { supabase } from "@/config/supabase";
import Animated, { FadeInDown } from "react-native-reanimated";

const ResetPassword = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setHasSession(!!data.session);
      } catch {
        setHasSession(false);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!password || password.length < 6) {
      showToast("error", "Erreur", "Le mot de passe doit contenir au moins 6 caracteres");
      return;
    }
    if (password !== confirm) {
      showToast("error", "Erreur", "Les mots de passe ne correspondent pas");
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (error) {
        showToast("error", "Erreur", error.message);
        Alert.alert("Erreur", error.message);
        return;
      }
      showToast("success", "Succes", "Mot de passe mis a jour. Connecte-toi.");
      await supabase.auth.signOut().catch(() => {});
      router.replace("/(auth)/login" as any);
    } catch (e: any) {
      setLoading(false);
      showToast("error", "Erreur", e.message || "Echec de la mise a jour");
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.root}>
        <AnimatedOrbs intensity={0.85} />

        <Animated.View entering={FadeInDown.duration(600)} style={styles.container}>
          <BrandHeader />

          <View style={styles.form}>
            <Typo size={20} fontWeight="800" color={colors.white} style={{ textAlign: "center" }}>
              Nouveau mot de passe
            </Typo>
            {hasSession === false && (
              <Typo size={13} color={colors.rose} style={{ textAlign: "center", lineHeight: 19 }}>
                Lien invalide ou expire. Redemande un lien depuis Mot de passe oublie.
              </Typo>
            )}
            <View style={styles.fieldShell}>
              <Input
                placeholder="Nouveau mot de passe"
                type="password"
                value={password}
                onChangeText={setPassword}
                icon={<IconLock size={verticalScale(22)} color={colors.neutral400} />}
              />
            </View>
            <View style={styles.fieldShell}>
              <Input
                placeholder="Confirme le mot de passe"
                type="password"
                value={confirm}
                onChangeText={setConfirm}
                icon={<IconLockKey size={verticalScale(22)} color={colors.neutral400} />}
              />
            </View>
            <Button onPress={handleSubmit} loading={loading}>
              <Typo fontWeight="700" color={colors.white} size={17}>
                Mettre a jour
              </Typo>
            </Button>
          </View>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
    backgroundColor: "#05070F",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "stretch",
    gap: spacingY._25,
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._30,
  },
  form: {
    gap: 14,
  },
  fieldShell: {
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 2,
  },
});
