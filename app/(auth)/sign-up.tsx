import { Alert, Pressable, StyleSheet, View } from "react-native"
import React, { useEffect, useState } from "react"
import ScreenWrapper from "@/components/screen-wrapper"
import Typo from "@/components/typo"
import BrandHeader from "@/components/brand-header"
import AnimatedOrbs from "@/components/animated-orbs"
import { colors, spacingX, spacingY } from "@/constants/theme"
import { verticalScale } from "@/utils/styling"
import Input from "@/components/input"
import { ArrowClockwiseIcon as IconArrowClockwise } from "phosphor-react-native/src/icons/ArrowClockwise";
import { ArrowRightIcon as IconArrowRight } from "phosphor-react-native/src/icons/ArrowRight";
import { AtIcon as IconAt } from "phosphor-react-native/src/icons/At";
import { EnvelopeSimpleIcon as IconEnvelopeSimple } from "phosphor-react-native/src/icons/EnvelopeSimple";
import { GoogleLogoIcon as IconGoogleLogo } from "phosphor-react-native/src/icons/GoogleLogo";
import { LockIcon as IconLock } from "phosphor-react-native/src/icons/Lock";
import { UserIcon as IconUser } from "phosphor-react-native/src/icons/User";
import Button from "@/components/button"
import { useRouter } from "expo-router"
import { useAuth } from "@/context/auth-context"
import { useLocale } from "@/context/locale-context"
import { useToast } from "@/context/toast-context"
import { z, ZodError } from "zod"
import Animated, { FadeInDown } from "react-native-reanimated"

const SignUp = () => {
  const router = useRouter()
  const { signUp, resendConfirmation, verifyCode, loginWithGoogle } = useAuth()
  const { t } = useLocale()
  const { showToast } = useToast()

  const signUpSchema = z.object({
    name: z.string().min(2, { message: t("nameMin2") }),
    email: z.email({ message: t("pleaseEnterValidEmail") }),
    password: z.string().min(6, { message: t("passwordMin6") }),
  })

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [code, setCode] = useState("")
  const [countdown, setCountdown] = useState(180)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const res = await loginWithGoogle()
    setGoogleLoading(false)
    if (res.redirecting) return // web : le navigateur part vers Google
    if (res.success) {
      showToast("success", "Compte Google lié", "Bienvenue !")
      router.replace("/(tabs)" as any)
    } else if (res.msg !== "Connexion Google annulée") {
      showToast("error", t("error"), res.msg || t("somethingWentWrong"))
    }
  }

  useEffect(() => {
    if (!pendingEmail) return
    setCountdown(180)
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
  }, [pendingEmail])

  const handleResend = async () => {
    if (!pendingEmail) return
    setResending(true)
    const res = await resendConfirmation(pendingEmail)
    if (res.success) setCountdown(180)
    showToast(res.success ? "success" : "error", t("emailResent"), res.msg || "")
    setResending(false)
  }

  const handleVerify = async () => {
    if (!pendingEmail) return
    const clean = code.replace(/\D/g, "")
    if (clean.length < 6) {
      showToast("error", t("error"), "Entre le code a 6 chiffres recu par mail.")
      return
    }
    setVerifying(true)
    const res = await verifyCode(pendingEmail, clean)
    setVerifying(false)
    if (res.success) {
      showToast("success", "Compte confirme", "Bienvenue !")
      router.replace("/(tabs)" as any)
    } else {
      showToast("error", t("error"), res.msg || "Code incorrect ou expire.")
      Alert.alert(t("error"), res.msg || "Code incorrect ou expire.")
    }
  }

  const handleSubmit = async () => {
    try {
      const parsed = signUpSchema.parse({ name, email, password })
      setLoading(true)
      const res = await signUp(parsed.email.trim(), parsed.password, parsed.name.trim())
      if (!res.success) {
        if ((res as any).needsVerification) {
          setPendingEmail(parsed.email.trim())
          showToast("error", t("error"), res.msg || t("somethingWentWrong"))
        } else {
          showToast("error", t("error"), res.msg || t("somethingWentWrong"))
          Alert.alert(t("error"), res.msg || t("somethingWentWrong"))
        }
      } else {
        showToast("success", `Bienvenue ${parsed.name}`, "Compte cree avec succes")
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
        <AnimatedOrbs intensity={0.85} />

        <Animated.View entering={FadeInDown.duration(600)} style={styles.container}>
          <BrandHeader email={pendingEmail} compact={!!pendingEmail} />

          {!pendingEmail ? (
            <View style={styles.form}>
              <Animated.View entering={FadeInDown.duration(600).delay(80)}>
                <View style={styles.fieldShell}>
                  <Input
                    placeholder={t("enterName")}
                    onChangeText={setName}
                    icon={<IconUser size={verticalScale(22)} color={colors.neutral400} />}
                  />
                </View>
              </Animated.View>
              <Animated.View entering={FadeInDown.duration(600).delay(140)}>
                <View style={styles.fieldShell}>
                  <Input
                    placeholder={t("enterEmail")}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    icon={<IconAt size={verticalScale(22)} color={colors.neutral400} />}
                  />
                </View>
              </Animated.View>
              <Animated.View entering={FadeInDown.duration(600).delay(200)}>
                <View style={styles.fieldShell}>
                  <Input
                    placeholder={t("enterPassword")}
                    type="password"
                    onChangeText={setPassword}
                    icon={<IconLock size={verticalScale(22)} color={colors.neutral400} />}
                  />
                </View>
              </Animated.View>
              <Animated.View entering={FadeInDown.duration(600).delay(260)}>
                <Button onPress={handleSubmit} loading={loading}>
                  <Typo fontWeight="700" color={colors.white} size={17}>
                    {t("createAccount")}
                  </Typo>
                  <View style={styles.trailingIcon}>
                    <IconArrowRight size={18} color={colors.white} weight="bold" />
                  </View>
                </Button>
              </Animated.View>

              <View style={styles.authOptions}>
                <Typo size={14} color={colors.neutral400}>{t("alreadyHaveAccount")}</Typo>
                <Pressable onPress={() => router.navigate("/(auth)/login")}>
                  <Typo size={14} color={colors.primary} fontWeight="700">
                    {t("login")}
                  </Typo>
                </Pressable>
              </View>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Typo size={12} color={colors.neutral500}>ou</Typo>
                <View style={styles.dividerLine} />
              </View>

              <Pressable onPress={handleGoogle} disabled={googleLoading || loading} style={styles.googleBtn}>
                <IconGoogleLogo size={20} color={colors.white} weight="bold" />
                <Typo size={15} color={colors.white} fontWeight="700">
                  {googleLoading ? "..." : "Continuer avec Google"}
                </Typo>
              </Pressable>
            </View>
          ) : (
            <View style={styles.otpShell}>
              <View style={styles.otpCore}>
                <View style={styles.otpHead}>
                  <IconEnvelopeSimple size={20} color={colors.primary} />
                  <Typo size={16} fontWeight="800" color={colors.white} style={{ textAlign: "center" }}>
                    {t("verifyEmailTitle")}
                  </Typo>
                </View>
                <Typo size={13} color={colors.neutral400} style={{ textAlign: "center", lineHeight: 19 }}>
                  Code a 6 chiffres envoye a {pendingEmail}. Saisis-le ci-dessous (pense aux spams).
                </Typo>
                <View style={styles.fieldShell}>
                  <Input
                    placeholder="000000"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={code}
                    onChangeText={(v: string) => setCode(v.replace(/[^0-9]/g, ""))}
                    inputStyle={styles.codeInput}
                  />
                </View>
                <Button onPress={handleVerify} loading={verifying}>
                  <Typo fontWeight="700" color={colors.white} size={16}>
                    Confirmer mon compte
                  </Typo>
                </Button>
                <Pressable onPress={handleResend} disabled={resending || countdown > 0} style={styles.resendBtn}>
                  <IconArrowClockwise size={16} color={countdown > 0 ? colors.neutral500 : colors.primary} />
                  <Typo size={14} color={countdown > 0 ? colors.neutral500 : colors.primary} fontWeight="700">
                    {resending ? "..." : countdown > 0 ? `Renvoyer dans ${countdown}s` : "Renvoyer le code"}
                  </Typo>
                </Pressable>
                {countdown <= 0 && (
                  <Typo size={12} color={colors.rose} style={{ textAlign: "center" }}>
                    Code expire. Demande un nouveau code.
                  </Typo>
                )}
                <Typo size={12} color={colors.neutral500} style={{ textAlign: "center", lineHeight: 17 }}>
                  Pas de mail apres 5 min ? Verifie les spams et l'onglet Promotions de Gmail.
                </Typo>
                <Pressable onPress={() => router.replace("/(auth)/login")}>
                  <Typo size={14} color={colors.neutral400} fontWeight="600" style={{ textAlign: "center" }}>
                    {t("goToLogin")}
                  </Typo>
                </Pressable>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </ScreenWrapper>
  )
}

export default SignUp

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
  authOptions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
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
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
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
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingVertical: 14,
  },
})
