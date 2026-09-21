import ScreenWrapper from "@/components/screen-wrapper"
import Typo from "@/components/typo"
import { colors, radius, spacingX } from "@/constants/theme"
import { useAuth } from "@/context/auth-context"
import { useLocale } from "@/context/locale-context"
import { getProfileImage } from "@/services/images-service"
import { OptionType } from "@/types"
import { verticalScale } from "@/utils/styling"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import * as Icons from "phosphor-react-native"
import React from "react"
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from "react-native"
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated"
import * as Updates from "expo-updates"
import Constants from "expo-constants"
import { useOTAUpdate } from "@/hooks/use-ota-update"

const getFeatures = (t:any): OptionType[] => [
  {
    title: t("statistics"),
    icon: <Icons.ChartBar size={26} color={colors.white} weight="fill" />,
    bgColor: "#8b5cf6",
    routeName: "/statistics",
  },
  {
    title: t("myWallets"),
    icon: <Icons.Folders size={26} color={colors.white} weight="fill" />,
    bgColor: "#ec4899",
    routeName: "/wallet",
  },
  {
    title: t("exportData"),
    icon: <Icons.FileArrowUp size={26} color={colors.white} weight="fill" />,
    bgColor: "#0ea5e9",
    // routeName: "/(modals)/exportDataModal",
    routeName: "commingsoon",
  },
]

const getUtilities = (t:any): OptionType[] => [
  {
    title: t("exchangeRate"),
    icon: (
      <Icons.CurrencyCircleDollar
        size={26}
        color={colors.white}
        weight="fill"
      />
    ),
    bgColor: "#f59e0b",
    routeName: "/(modals)/exchange-rate-modal",
  },
  {
    title: t("loanCalculator"),
    icon: <Icons.Percent size={26} color={colors.white} weight="fill" />,
    bgColor: "#10b981",
    // routeName: "/(modals)/loanCalculatorModal",
    routeName: "commingsoon",
  },
  {
    title: t("splitBill"),
    icon: <Icons.UsersThree size={26} color={colors.white} weight="fill" />,
    bgColor: "#6366f1",
    // routeName: "/(modals)/splitBillModal",
    routeName: "commingsoon",
  },
]

const getSettings = (t:any): OptionType[] => [
  {
    title: t("updateProfile"),
    icon: <Icons.HardDrives size={26} color={colors.white} weight="fill" />,
    routeName: "/(modals)/update-profile-modal",
    bgColor: colors.neutral600,
  },
  {
    title: t("settings"),
    icon: <Icons.GearSix size={26} color={colors.white} weight="fill" />,
    routeName: "/(modals)/setting-modal",
    bgColor: "#6366f1",
  },
]

const More = () => {
  const { user } = useAuth()
  const { t } = useLocale()
  const router = useRouter()
  const features = getFeatures(t)
  const utilities = getUtilities(t)
  const settings = getSettings(t)
  const { checking: otaChecking, checkAndNotify } = useOTAUpdate()
  const [checking, setChecking] = React.useState(false)
  const isChecking = checking || otaChecking

  const handlePress = (item: OptionType) => {
    if (!item.routeName) return

    item?.routeName === "commingsoon"
      ? Alert.alert(
          t("comingSoonTitle"),
          t("comingSoonMsg"),
        )
      : router.push(item?.routeName as any)
  }

  const handleCheckUpdate = async () => {
    if (isChecking) return
    if (!Updates.isEnabled) {
      Alert.alert(t("upToDateTitle"), "OTA désactivé en dev — fais un build preview/production pour tester.")
      return
    }
    try {
      setChecking(true)
      const hasUpdate = await checkAndNotify(false)
      if (!hasUpdate) {
        // checkAndNotify a déjà alerté si update dispo, sinon on confirme "à jour"
        // On revérifie silencieusement pour éviter double alerte
        const check = await Updates.checkForUpdateAsync()
        if (!check.isAvailable) Alert.alert(t("upToDateTitle"), t("upToDateMsg"))
      }
    } catch (e: any) {
      Alert.alert(t("updateFailedTitle"), e?.message ?? t("updateFailedMsg"))
    } finally {
      setChecking(false)
    }
  }

  return (
    <ScreenWrapper style={{ paddingTop: verticalScale(20) }}>
      <View style={styles.container}>
        {/* User info */}
        <Animated.View
          entering={FadeInDown.springify().damping(50)}
          style={styles.cardContainer}
        >
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => router.push("/(modals)/profile-modal")}
          >
            <Image
              source={getProfileImage(user?.image)}
              style={styles.avatar}
              contentFit="cover"
              transition={100}
            />
            <View style={styles.nameContainer}>
              <Typo size={20} fontWeight={"600"} color={colors.neutral100}>
                {user?.name}
              </Typo>
              <Typo size={14} color={colors.neutral400}>
                {user?.email}
              </Typo>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Features */}
        <View style={styles.cardContainer}>
          <Typo
            size={16}
            fontWeight="700"
            color={colors.neutral350}
            style={styles.sectionTitle}
          >
            {t("features")}
          </Typo>
          <View style={styles.gridRow}>
            {features.map((item, index) => (
              <Animated.View
                key={index.toString()}
                entering={FadeInRight.delay(index * 50)
                  .springify()
                  .damping(50)}
              >
                <TouchableOpacity
                  style={{ flexDirection: "column" }}
                  onPress={() => handlePress(item)}
                >
                  <View style={styles.iconContainer}>
                    <View
                      style={[
                        styles.listIcon,
                        { backgroundColor: item.bgColor },
                      ]}
                    >
                      {item.icon && item.icon}
                    </View>
                    <View style={styles.textContainer}>
                      <Typo
                        size={16}
                        style={{ textAlign: "center" }}
                        fontWeight={"500"}
                      >
                        {item.title}
                      </Typo>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Utilities */}
        <View style={styles.cardContainer}>
          <Typo
            size={15}
            fontWeight="700"
            color={colors.neutral350}
            style={styles.sectionTitle}
          >
            {t("utilities")}
          </Typo>
          <View style={styles.gridRow}>
            {utilities.map((item, index) => (
              <Animated.View
                key={index.toString()}
                entering={FadeInRight.delay(index * 50)
                  .springify()
                  .damping(50)}
              >
                <TouchableOpacity
                  style={{ flexDirection: "column" }}
                  onPress={() => handlePress(item)}
                >
                  <View style={styles.iconContainer}>
                    <View
                      style={[
                        styles.listIcon,
                        { backgroundColor: item.bgColor },
                      ]}
                    >
                      {item.icon && item.icon}
                    </View>
                    <View style={styles.textContainer}>
                      <Typo
                        size={16}
                        style={{ textAlign: "center" }}
                        fontWeight={"500"}
                      >
                        {item.title}
                      </Typo>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.cardContainer}>
          <View style={styles.settingsSection}>
            {settings.map((item, index) => (
              <Animated.View
                key={index.toString()}
                entering={FadeInDown.delay(index * 50)
                  .springify()
                  .damping(50)}
              >
                {index > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  onPress={() => handlePress(item)}
                  style={styles.flexRow}
                >
                  <View
                    style={[styles.listIcon, { backgroundColor: item.bgColor }]}
                  >
                    {item.icon && item.icon}
                  </View>
                  <Typo size={16} style={{ flex: 1 }} fontWeight={"500"}>
                    {item.title}
                  </Typo>
                  <Icons.CaretRight
                    size={verticalScale(20)}
                    weight="bold"
                    color={colors.white}
                  />
                </TouchableOpacity>
              </Animated.View>
            ))}
            <View style={styles.divider} />
            <TouchableOpacity onPress={handleCheckUpdate} style={styles.flexRow} disabled={isChecking}>
              <View style={[styles.listIcon, { backgroundColor: "#f97316" }]}>
                <Icons.ArrowsClockwise size={26} color={colors.white} weight="fill" />
              </View>
              <View style={{ flex: 1 }}>
                <Typo size={16} fontWeight={"500"}>{t("checkUpdate")}</Typo>
                <Typo size={12} color={colors.neutral400}>v{Constants.expoConfig?.version ?? "1.0.0"} • {Updates.isEnabled ? (Updates.channel ?? "preview") : "dev"}</Typo>
              </View>
              {isChecking ? <ActivityIndicator color={colors.white} /> : <Icons.CaretRight size={verticalScale(20)} weight="bold" color={colors.white} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default More

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  cardContainer: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._15,
    padding: spacingX._10,
    marginBottom: verticalScale(10),
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._15,
  },
  avatar: {
    height: verticalScale(60),
    width: verticalScale(60),
    borderRadius: 100,
    backgroundColor: colors.neutral350,
  },
  nameContainer: {
    flex: 1,
    gap: verticalScale(2),
  },
  sectionTitle: {
    marginBottom: verticalScale(15),
  },
  gridRow: {
    flexDirection: "row",
    gap: spacingX._15,
    justifyContent: "space-around",
    marginBottom: verticalScale(10),
  },
  settingsSection: {
    gap: 0,
  },
  listIcon: {
    height: verticalScale(44),
    width: verticalScale(44),
    backgroundColor: colors.neutral500,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius._15,
    borderCurve: "continuous",
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
  },
  iconContainer: {
    alignItems: "center",
    gap: 6,
  },
  textContainer: {
    width: verticalScale(80),
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral700,
    marginVertical: verticalScale(9),
  },
})
