import { expenseCategories, incomeCategory } from "@/constants/data"
import { colors, radius, spacingX, spacingY } from "@/constants/theme"
import {
  TransactionItemProps,
  TransactionListType,
  TransactionType,
} from "@/types"
import { verticalScale } from "@/utils/styling"
import { FlatList } from "react-native"
import { useRouter } from "expo-router"
import React from "react"
import { StyleSheet, TouchableOpacity, View } from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"
import LoadingCompenent from "./loading"
import Typo from "./typo"
import { useSupabaseWallets } from "@/hooks/use-supabase-data"
import { useAuth } from "@/context/auth-context"
import { getCurrencyInfo } from "@/constants/currencies"
import { formatCurrency } from "@/utils/common"

export const TransactionList = ({
  data,
  title,
  loading,
  emptyListMessage,
}: TransactionListType) => {
  //hande transaction item click function

  const router = useRouter()
  const handleClick = (item: TransactionType) => {
    const d: any = item?.date;
    const iso = d?.toDate ? d.toDate().toISOString() : d ? new Date(d).toISOString() : new Date().toISOString();
    router.push({
      pathname: "/(modals)/transaction-modal",
      params: {
        id: item?.id,
        type: item?.type,
        amount: item?.amount.toString(),
        category: item?.category,
        date: iso,
        description: item?.description,
        image: item?.image,
        uid: item?.uid,
        walletId: item?.walletId,
      },
    })
  }

  return (
    <View style={styles.container}>
      {title && (
        <Typo size={20} fontWeight={"500"}>
          {title}
        </Typo>
      )}
      <View style={styles.list}>
        <FlatList
          data={data}
          renderItem={({ item, index }) => (
            <TransactionItem
              item={item}
              index={index}
              handleClick={handleClick}
            />
          )}
          keyExtractor={(item) => item.id!}
        />
      </View>
      {!loading && data.length === 0 && (
        <Typo
          size={15}
          color={colors.neutral400}
          style={{ textAlign: "center", marginTop: spacingY._15 }}
        >
          {emptyListMessage}
        </Typo>
      )}
      {loading && (
        <View style={{ top: verticalScale(100) }}>
          <LoadingCompenent />
        </View>
      )}
    </View>
  )
}

//Transaction Items
const TransactionItem = ({
  item,
  index,
  handleClick,
}: TransactionItemProps) => {
  const { user } = useAuth()
  const { data: wallets } = useSupabaseWallets(user?.uid)
  let category =
    item?.type === "income"
      ? incomeCategory
      : (expenseCategories[item?.category as string] || expenseCategories.others)
  const IconComponent = category?.icon || expenseCategories.others.icon
  const walletCur = (wallets.find((w: any) => w.id === (item as any).walletId)?.currency || "XOF") as string
  const curInfo = getCurrencyInfo(walletCur)

  //format transaction date
  const date = (() => {
    const d: any = item?.date;
    const jsDate = d?.toDate ? d.toDate() : d ? new Date(d) : null;
    return jsDate?.toLocaleDateString("en-US", { hour: "numeric", minute: "numeric", day: "numeric", month: "short" });
  })()

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70)
        .springify()
        .damping(50)}
    >
      <TouchableOpacity onPress={() => handleClick(item)} style={styles.row}>
        <View style={[styles.icon, { backgroundColor: category.bgColor }]}>
          {IconComponent && (
            <IconComponent
              size={verticalScale(25)}
              weight="fill"
              color={colors.white}
            />
          )}
        </View>
        <View style={styles.categoryDes}>
          <Typo size={17}>{category.label}</Typo>
          <Typo
            size={12}
            color={colors.neutral400}
            textProps={{ numberOfLines: 1 }}
          >
            {item.description}
          </Typo>
        </View>
        <View style={styles.amountDate}>
          <Typo
            size={15}
            fontWeight={"600"}
            color={item?.type === "income" ? colors.green : colors.rose}
            textProps={{ numberOfLines: 1 } as any}
          >
            {(() => {
              try {
                const sign = item.type === "income" ? "+ " : "- ";
                return sign + formatCurrency(Number(item.amount), "fr-FR", walletCur, 0);
              } catch {
                const sign = item.type === "income" ? "+ " : "- ";
                return sign + `${curInfo?.symbol || walletCur} ${Number(item.amount).toLocaleString("fr-FR")}`;
              }
            })()}
          </Typo>
          <Typo size={13} color={colors.neutral400}>
            {date}
          </Typo>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacingY._17,
  },
  list: {
    minHeight: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacingX._12,
    backgroundColor: colors.neutral800,
    padding: spacingY._10,
    borderRadius: radius._17,
    paddingHorizontal: spacingY._10,
    marginBottom: spacingY._17,
  },
  icon: {
    height: verticalScale(44),
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius._12,
    borderCurve: "continuous",
  },
  categoryDes: {
    flex: 1,
    gap: 2.5,
  },
  amountDate: {
    alignItems: "flex-end",
    gap: 3,
  },
})
