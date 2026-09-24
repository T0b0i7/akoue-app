import { colors, radius, spacingX } from "@/constants/theme"
import { WalletType } from "@/types"
import { verticalScale } from "@/utils/styling"
import { Image } from "expo-image"
import { Router } from "expo-router"
import * as Icons from "phosphor-react-native"
import React from "react"
import { StyleSheet, TouchableOpacity, View } from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"
import Typo from "./typo"
import { findWalletIcon, parseIconString } from "@/constants/wallet-icons"
import { getCurrencyInfo } from "@/constants/currencies"
import { formatCurrency } from "@/utils/common"

const WalletListItem = ({
  item,
  index,
  router,
}: {
  item: WalletType
  index: number
  router: Router
}) => {
  //function to open the wallet
  const openWallet = () => {
    router.push({
      pathname: "/(modals)/wallet-modal",
      params: {
        id: item?.id,
        name: item?.name,
        image: item?.image,
        amount: String(item?.amount ?? 0),
        currency: (item as any)?.currency || "XOF",
      },
    })
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100)
        .springify()
        .damping(50)}
    >
      <TouchableOpacity style={styles.container} onPress={openWallet}>
        {(() => {
          const parsed = parseIconString(item?.image as any);
          if (parsed) {
            const def = findWalletIcon(parsed.id);
            const IconComp: any = def.icon;
            return (
              <View style={[styles.imageContainer, { backgroundColor: parsed.color, borderColor: parsed.color, alignItems: "center", justifyContent: "center" }]}>
                <IconComp size={verticalScale(22)} color={colors.white} weight="fill" />
              </View>
            );
          }
          return (
            <View style={styles.imageContainer}>
              <Image
                style={{ flex: 1 }}
                source={item?.image as any}
                contentFit="cover"
                transition={100}
              />
            </View>
          );
        })()}
        <View style={styles.nameContainer}>
          <Typo size={16}>{item?.name}</Typo>
          <Typo size={14} color={colors.neutral400}>
            {(() => {
              const cur = (item as any)?.currency || "XOF";
              try { return formatCurrency(Number(item?.amount || 0), "fr-FR", cur, 0); } catch { return `${getCurrencyInfo(cur)?.symbol || cur} ${Number(item?.amount || 0).toLocaleString("fr-FR")}`; }
            })()}
          </Typo>
        </View>
        <Icons.CaretRight
          size={verticalScale(20)}
          weight="bold"
          color={colors.white}
        />
      </TouchableOpacity>
    </Animated.View>
  )
}

export default WalletListItem

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(17),
  },
  imageContainer: {
    height: verticalScale(45),
    width: verticalScale(45),
    borderWidth: 1,
    borderColor: colors.neutral600,
    borderRadius: radius._12,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  nameContainer: {
    flex: 1,
    gap: 2,
    marginLeft: spacingX._10,
  },
})
