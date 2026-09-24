import { Alert, Image, Pressable, StyleSheet, View } from "react-native"
import React, { useState } from "react"
import ScreenWrapper from "@/components/screen-wrapper"
import Typo from "@/components/typo"
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

const SignUp = () => {
  const router = useRouter()
  const { signUp } = useAuth()
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

  const handleSubmit = async () => {
    try {
      const parsed = signUpSchema.parse({ name, email, password })

      setLoading(true)
      const res = await signUp(
        parsed.email.trim(),
        parsed.password,
        parsed.name.trim(),
      )

      if (!res.success) {
        showToast("error", t("error"), res.msg || t("somethingWentWrong"))
        Alert.alert(t("error"), res.msg || t("somethingWentWrong"))
      } else {
        showToast("success", `Bienvenue ${parsed.name} 🎉`, "Compte créé avec succès")
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
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require("@/public/images/splash-icon.png")}
            style={styles.logo}
          />
          <Typo size={42} fontWeight={"800"}>
            Akouè
          </Typo>
          <Typo size={18} color={colors.neutral400}>
            {t("spendSmarter")}
          </Typo>
        </View>

        <View style={styles.form}>
          <Input
            placeholder={t("enterName")}
            onChangeText={(value) => {
              setName(value)
            }}
            icon={
              <Icons.User
                size={verticalScale(26)}
                color={colors.neutral350}
                weight="fill"
              />
            }
          />
          <Input
            placeholder={t("enterEmail")}
            onChangeText={(value) => {
              setEmail(value)
            }}
            icon={
              <Icons.At
                size={verticalScale(26)}
                color={colors.neutral350}
                weight="fill"
              />
            }
          />
          <Input
            placeholder={t("enterPassword")}
            type="password"
            onChangeText={(value) => {
              setPassword(value)
            }}
            icon={
              <Icons.Lock
                size={verticalScale(26)}
                color={colors.neutral350}
                weight="fill"
              />
            }
          />
          <Button onPress={handleSubmit} loading={loading}>
            <Typo fontWeight={"700"} color={colors.white} size={21}>
              {t("createAccount")}
            </Typo>
          </Button>
        </View>

        <View style={styles.authOptions}>
          <Typo size={15}>{t("alreadyHaveAccount")}</Typo>
          <Pressable onPress={() => router.navigate("/(auth)/login")}>
            <Typo size={15} color={colors.primary} fontWeight={"700"}>
              {t("login")}
            </Typo>
          </Pressable>
        </View>

        {/* <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Typo size={15}>Or login with</Typo>
          <View style={styles.dividerLine} />
        </View> */}

        {/* <View style={styles.socialButtonContainer}>
          <Pressable onPress={handleGoogleSignIn}>
            <Image
              source={require("@/public/images/google.png")}
              style={styles.socialButton}
            />
          </Pressable>
        </View> */}
      </View>
    </ScreenWrapper>
  )
}

export default SignUp

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._30,
    paddingHorizontal: spacingX._20,
  },
  logoContainer: {
    gap: 5,
    marginTop: spacingY._30,
    marginBottom: spacingY._10,
    alignItems: "center",
  },
  logo: {
    width: verticalScale(100),
    height: verticalScale(100),
  },
  form: {
    gap: spacingY._20,
  },
  authOptions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  divider: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dividerLine: {
    height: 1,
    flex: 1,
    backgroundColor: colors.neutral700,
    marginHorizontal: spacingX._10,
  },
  socialButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
  },
  socialButton: {
    width: verticalScale(40),
    height: verticalScale(40),
  },
})
