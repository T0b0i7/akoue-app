import { Alert, Pressable, StyleSheet, View } from "react-native";
import React, { useState } from "react";
import ScreenWrapper from "@/components/screen-wrapper";
import Typo from "@/components/typo";
import BrandHeader from "@/components/brand-header";
import { AuthHeader } from "@/components/auth-header";
import AnimatedOrbs from "@/components/animated-orbs";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import Input from "@/components/input";
import { ArrowLeftIcon as IconArrowLeft } from "phosphor-react-native/src/icons/ArrowLeft";
import { ArrowRightIcon as IconArrowRight } from "phosphor-react-native/src/icons/ArrowRight";
import { AtIcon as IconAt } from "phosphor-react-native/src/icons/At";
import { CheckCircleIcon as IconCheckCircle } from "phosphor-react-native/src/icons/CheckCircle";
import Button from "@/components/button";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "expo-router";
import { useLocale } from "@/context/locale-context";
import { useToast } from "@/context/toast-context";
import Animated, { FadeInDown } from "react-native-reanimated";

const ForgotPassword = () => {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const { t } = useLocale();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      showToast("error", t("warning"), t("pleaseEnterEmail"));
      Alert.alert(t("warning"), t("pleaseEnterEmail"));
      return;
    }
    setLoading(true);
    const res = await forgotPassword(clean);
    setLoading(false);

    if (res.success) {
      setSent(true);
      showToast("success", t("success"), t("resetLinkSent"));
    } else {
      showToast("error", t("error"), res.msg || t("somethingWentWrong"));
      Alert.alert(t("error"), res.msg || t("somethingWentWrong"));
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.root}>
        <AnimatedOrbs intensity={0.85} />
        <AuthHeader backTo="/(auth)/login" title={t("forgotPasswordTitle")} />

        <Animated.View entering={FadeInDown.duration(600)} style={styles.container}>
          <BrandHeader />

          <View style={styles.form}>
            <Typo size={20} fontWeight="800" color={colors.white} style={{ textAlign: "center" }}>
              {t("forgotPasswordTitle")}
            </Typo>
            <Typo size={13} color={colors.neutral400} style={{ textAlign: "center", lineHeight: 19 }}>
              {t("forgotPasswordDesc")}
            </Typo>

            <View style={styles.fieldShell}>
              <Input
                placeholder={t("enterEmail")}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<IconAt size={verticalScale(22)} color={colors.neutral400} />}
              />
            </View>

            <Button onPress={handleSubmit} loading={loading}>
              <Typo fontWeight="700" color={colors.white} size={17}>
                {t("resetPassword")}
              </Typo>
              <View style={styles.trailingIcon}>
                <IconArrowRight size={18} color={colors.white} weight="bold" />
              </View>
            </Button>

            {sent && (
              <View style={styles.sentBox}>
                <IconCheckCircle size={20} color={colors.green} />
                <Typo size={13} color={colors.neutral400} style={{ textAlign: "center", lineHeight: 19 }}>
                  {t("resetLinkSent")}. Ouvre le lien (pense aux spams), tu pourras definir un nouveau mot de passe.
                </Typo>
              </View>
            )}

            <Pressable onPress={() => router.replace("/(auth)/login" as any)} style={styles.backBtn}>
              <IconArrowLeft size={16} color={colors.primary} />
              <Typo size={14} color={colors.primary} fontWeight="700">
                {t("login")}
              </Typo>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
};

export default ForgotPassword;

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
  trailingIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  sentBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(22,163,74,0.12)",
    borderWidth: 1,
    borderColor: "rgba(22,163,74,0.30)",
    borderRadius: 14,
    padding: 12,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
});
