import { Alert, Pressable, StyleSheet, View } from "react-native"
import React, { useEffect, useState } from "react"
import ScreenWrapper from "@/components/screen-wrapper"
import Typo from "@/components/typo"
import BrandHeader from "@/components/brand-header"
import { colors, spacingX, spacingY } from "@/constants/theme"
import { verticalScale } from "@/utils/styling"
import Input from "@/components/input"
import * as Icons from "phosphor-react-native"
import Button from "@/components/button"
import { useRouter } from "expo-router"
import { useAuth } from "@/context/auth-context"
import { useLocale } from "@/context/locale-context"
import { useToast } from "@/context/toast-context"
import { z, ZodError } from "zod"
import Animated, { FadeInDown } from "react-native-reanimated"

const Login = () => {
  const router = useRouter()
  const { login: loginUser, resendConfirmation, verifyCode } = useAuth()
  const { t } = useLocale()
  const { showToast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [code, setCode] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [countdown, setCountdown] = useState(20)

  useEffect(() => {
    if (!verifyEmail) return
    setCountdown(20)
    setCode("")
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [verifyEmail])

  const handleResend = async () => {
    if (!verifyEmail) return
    setResending(true)
    const res = await resendConfirmation(verifyEmail)
    if (res.success) setCountdown(20)
    showToast(res.success ? "success" : "error", t("emailResent"), res.msg || "")
    setResending(false)
  }

  const handleVerify = async () => {
    if (!verifyEmail) return
    if (countdown <= 0) {
      showToast("error", t("error"), "Code expire. Demande un nouveau code.")
      Alert.alert(t("error"), "Code expire. Demande un nouveau code.")
      return
    }
    setVerifying(true)
    const res = await verifyCode(verifyEmail, code)
    if (res.success) {
      showToast("success", "Compte confirme", res.msg || "")
      router.replace("/(tabs)" as any)
    } else {
      showToast("error", t("error"), res.msg || "")
      Alert.alert(t("error"), res.msg || "")
    }
    setVerifying(false)
  }

  const loginSchema = z.object({
    email: z.email({ message: t("pleaseEnterValidEmail") }),
    password: z.string().min(6, { message: t("passwordMin6") }),
  })

  const handleSubmit = async () => {
    try {
      const parsed = loginSchema.parse({ email, password })
      setLoading(true)
      const res = await loginUser(parsed.email.trim(), parsed.password)
      if (!res.success) {
        if ((res as any).needsVerification) setVerifyEmail(parsed.email.trim())
        showToast("error", t("error"), res.msg || t("somethingWentWrong"))
        Alert.alert(t("error"), res.msg || t("somethingWentWrong"))
      } else {
        const name = parsed.email.split("@")[0]
        showToast("success", `Ravi de te revoir, ${name}`, "Connexion reussie")
        router.replace("/(tabs)" as any)
      }
    } catch (err) {
      if (err instanceof ZodError) {
        showToast("error", t("validationError"), err.issues[0].message)
        Alert.alert(t("validationError"), err.issues[0].message)
      } else {
        showToast("error", t("error"), t("networkError"))
        Alert.alert(t("error"), t("networkError"))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenWrapper>
      <View style={styles.root}>
        <View style={styles.orbBlue} pointerEvents="none" />
        <View style={styles.orbGreen} pointerEvents="none" />

        <Animated.View entering={FadeInDown.duration(600)} style={styles.container}>
          <BrandHeader email={verifyEmail} compact={!!verifyEmail} />

          {!verifyEmail ? (
            <View style={styles.form}>
              <Animated.View entering={FadeInDown.duration(600).delay(80)}>
                <View style={styles.fieldShell}>
                  <Input
                    placeholder={t("enterEmail")}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    icon={<Icons.At size={verticalScale(22)} color={colors.neutral400} />}
                  />
                </View>
              </Animated.View>
              <Animated.View entering={FadeInDown.duration(600).delay(140)}>
                <View style={styles.fieldShell}>
                  <Input
                    placeholder={t("enterPassword")}
                    type="password"
                    onChangeText={setPassword}
                    icon={<Icons.Lock size={verticalScale(22)} color={colors.neutral400} />}
                  />
                </View>
              </Animated.View>
              <Animated.View entering={FadeInDown.duration(600).delay(200)}>
                <Button onPress={handleSubmit} loading={loading}>
                  <Typo fontWeight="700" color={colors.white} size={17}>
                    {t("login")}
                  </Typo>
                  <View style={styles.trailingIcon}>
                    <Icons.ArrowRight size={18} color={colors.white} weight="bold" />
                  </View>
                </Button>
              </Animated.View>

              <View style={styles.authOptions}>
                <Pressable onPress={() => router.navigate("/(auth)/sign-up")}>
                  <Typo size={14} color={colors.primary} fontWeight="700">
                    {t("createAccount")}
                  </Typo>
                </Pressable>
                <Pressable onPress={() => router.navigate("/(auth)/forgot-password")}>
                  <Typo size={14} color={colors.neutral400} fontWeight="600">
                    {t("forgotPassword")}
                  </Typo>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.otpShell}>
              <View style={styles.otpCore}>
                <View style={styles.otpHead}>
                  <Icons.Timer size={20} color={countdown > 0 ? colors.primary : colors.rose} />
                  <Typo size={14} color={countdown > 0 ? colors.white : colors.rose} fontWeight="700">
                    {countdown > 0 ? `Expire dans ${countdown}s` : "Code expire"}
                  </Typo>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(countdown / 20) * 100}%`,
                        backgroundColor: countdown > 5 ? colors.primary : colors.rose,
                      },
                    ]}
                  />
                </View>
                <Typo size={13} color={colors.neutral400} style={{ textAlign: "center", lineHeight: 19 }}>
                  {t("verifyEmailMsg")}
                </Typo>
                <Input
                  placeholder="123456"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  inputStyle={styles.codeInput}
                />
                <Button onPress={handleVerify} loading={verifying} disabled={countdown <= 0}>
                  <Typo fontWeight="700" color={colors.white} size={16}>
                    Confirmer
                  </Typo>
                </Button>
                <Pressable onPress={handleResend} disabled={resending} style={styles.resendBtn}>
                  <Icons.ArrowClockwise size={16} color={colors.primary} />
                  <Typo size={14} color={colors.primary} fontWeight="700">
                    {resending ? "..." : t("resendEmail")}
                  </Typo>
                </Pressable>
                {countdown <= 0 && (
                  <Typo size={13} color={colors.rose} style={{ textAlign: "center" }}>
                    Code expire. Demande un nouveau code.
                  </Typo>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </ScreenWrapper>
  )
}

export default Login

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
    backgroundColor: "#05070F",
    justifyContent: "center",
  },
  orbBlue: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(10,92,255,0.22)",
  },
  orbGreen: {
    position: "absolute",
    bottom: -70,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(34,197,94,0.12)",
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
  authOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
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
  otpShell: {
    padding: 2,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  otpCore: {
    borderRadius: 26,
    backgroundColor: "#0B1530",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    gap: 12,
  },
  otpHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  codeInput: {
    fontSize: 22,
    letterSpacing: 8,
    textAlign: "center",
    fontWeight: "800",
  },
  resendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
})
