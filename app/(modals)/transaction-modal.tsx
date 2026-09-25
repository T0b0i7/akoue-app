import BackButton from "@/components/back-button"
import ButtonComponent from "@/components/button"
import HeaderComponent from "@/components/header"
import ImageUpload from "@/components/image-upload"
import ModalWrapper from "@/components/modal-wrapper"
import TextInputComponent from "@/components/text-input"
import Typo from "@/components/typo"
import { getExpenseCategories, getTransactionTypes } from "@/constants/data"
import { colors, radius, spacingX, spacingY } from "@/constants/theme"
import { useAuth } from "@/context/auth-context"
import { useLocale } from "@/context/locale-context"
import { useToast } from "@/context/toast-context"
import { useSupabaseWallets } from "@/hooks/use-supabase-data"
import {
  createOrUpdateTransaction,
  deleteTransaction,
} from "@/services/transaction-service"
import { TransactionType } from "@/types"
import { scale, verticalScale } from "@/utils/styling"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useLocalSearchParams, useRouter } from "expo-router"
import * as Icons from "phosphor-react-native"
import React, { useEffect, useState } from "react"
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"
import { Dropdown } from "react-native-element-dropdown"
import ConfirmDialog from "@/components/confirm-dialog"

const TransactionModal = () => {
  const { user } = useAuth()
  const { t } = useLocale()
  const { showToast } = useToast()
  const [transaction, setTransactionData] = useState<TransactionType>({
    type: "expense",
    amount: 0,
    description: "",
    category: "",
    date: new Date(),
    walletId: "",
    image: null,
  })

  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const router = useRouter()

  function closeModal() {
    try { (router as any).dismiss?.(); } catch {}
    setTimeout(() => {
      try {
        const still = typeof window !== "undefined" && window.location.pathname.endsWith("transaction-modal");
        if (!still) return;
        if (router.canGoBack()) router.back(); else router.replace("/(tabs)" as any);
      } catch {}
    }, 250);
  }

  const {
    data: wallets,
    loading: walletLoading,
    error: walletError,
  } = useSupabaseWallets(user?.uid)

  //retrieve data from wallte to update
  const oldTransaction: any = useLocalSearchParams()

  const onDateChange = (event: any, selectedDate: any) => {
    const currentDate = selectedDate || transaction.date
    setTransactionData({ ...transaction, date: currentDate })
    setShowDatePicker(Platform.OS === "ios" ? true : false)
  }

  useEffect(() => {
    if (oldTransaction?.id) {
      setTransactionData({
        type: oldTransaction?.type,
        amount: Number(oldTransaction?.amount),
        description: oldTransaction.description || "",
        category: oldTransaction.category || "",
        date: new Date(oldTransaction.date),
        walletId: oldTransaction.walletId,
        image: oldTransaction?.image,
      })
    }
  }, [])

  //onsublmit function
  const onSubmit = async () => {
    const { type, amount, description, category, date, walletId, image } =
      transaction
    if (
      !type ||
      !amount ||
      (type === "expense" && !category) ||
      !date ||
      !walletId
    ) {
      const msg = t("pleaseFillRequired")
      setFeedback({ type: "error", msg })
      Alert.alert(t("transaction"), msg)
      return
    }
    // Validation montant : arrondi + bornes claires
    const numAmount = Number(amount)
    if (isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) {
      const msg = "Le montant doit être un nombre positif."
      setFeedback({ type: "error", msg })
      Alert.alert(t("transaction"), msg)
      return
    }
    if (numAmount > 1_000_000_000) {
      const msg = "Le montant est trop grand (maximum 1 milliard)."
      setFeedback({ type: "error", msg })
      Alert.alert(t("transaction"), msg)
      return
    }
    const roundedAmount = Math.round(numAmount * 100) / 100
    let transactionData: TransactionType = {
      type,
      amount: roundedAmount,
      description,
      category,
      date,
      walletId,
      image: image ? image : null,
      uid: user?.uid,
    }

    // include transaction id
    if (oldTransaction?.id) transactionData.id = oldTransaction.id
    setFeedback(null)
    setLoading(true)
    const result = await createOrUpdateTransaction(transactionData)
    setLoading(false)
    if (result.success) {
      if (loading) return;
      const isEdit = !!oldTransaction?.id
      const walletName = wallets.find((w:any)=>w.id===walletId)?.name || "portefeuille"
      const msg = isEdit ? `${type === "income" ? "Revenu" : "Dépense"} mise à jour • ${amount} sur ${walletName} ✏️` : `${type === "income" ? "💰 Revenu" : "💸 Dépense"} de ${amount} ajoutée sur ${walletName} • ${description || category || ""}`.trim()
      setFeedback({ type: "success", msg: t("transactionAdded") })
      showToast("success", isEdit ? "Transaction mise à jour" : "Transaction ajoutée", msg)
      setTimeout(() => closeModal(), 700)
    } else {
      const msg = result.msg || "Erreur"
      setFeedback({ type: "error", msg })
      showToast("error", "Erreur", msg)
      Alert.alert(t("transaction"), msg)
    }
  }

  const OnDelete = async () => {
    if (!oldTransaction?.id) return
    setLoading(true)
    const result = await deleteTransaction(
      oldTransaction?.id,
      oldTransaction?.walletId,
    )
    setLoading(false)
    if (result!.success) {
      setFeedback({ type: "success", msg: t("walletDeleted") })
      showToast("success", "Transaction supprimée", "Transaction supprimée 🗑️")
      setTimeout(() => closeModal(), 600)
    } else {
      const msg = result!.msg || "Erreur"
      setFeedback({ type: "error", msg })
      showToast("error", "Erreur", msg)
      Alert.alert(t("wallet"), msg)
    }
  }

  //Function show delete alert for deleting wallet
  const showDeleteAlert = () => {
    setConfirmVisible(true);
  }

  // const renderLabel = () => {
  //   if (value || isFocus) {
  //     return (
  //       <Text style={[styles.label, isFocus && { color: "blue" }]}>
  //         Dropdown label
  //       </Text>
  //     );
  //   }
  //   return null;
  // };

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <HeaderComponent
          title={oldTransaction?.id ? t("updateTransaction") : t("newTransaction")}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        {/* Form */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.form}
        >
          {/* inputContainer */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              {t("type")}
            </Typo>
            {/* drop down input */}
            <Dropdown
              style={styles.dropDownContainer}
              activeColor={colors.neutral700}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropDownSelectedText}
              iconStyle={styles.dropDownIcon}
              data={getTransactionTypes(t)}
              maxHeight={300}
              labelField="label"
              valueField="value"
              itemTextStyle={styles.dropDownItemText}
              itemContainerStyle={styles.dropdownItemContainer}
              containerStyle={styles.dropDownListContainer}
              value={transaction.type}
              onChange={(item) => {
                setTransactionData({ ...transaction, type: item.value })
              }}
            />
          </View>

          {/* inputContainer */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>{t("wallet")}</Typo>
            {/* drop down input */}
            <Dropdown
              style={styles.dropDownContainer}
              activeColor={colors.neutral700}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropDownSelectedText}
              iconStyle={styles.dropDownIcon}
              data={wallets?.map((wallet) => {
                const cur = (wallet as any)?.currency || "XOF";
                const sym = (() => { try { const { getCurrencyInfo } = require("@/constants/currencies"); return getCurrencyInfo(cur)?.symbol || cur; } catch { return cur; } })();
                const amt = Number(wallet.amount || 0).toLocaleString("fr-FR");
                return { label: `${wallet?.name} (${sym} ${amt})`, value: wallet?.id };
              })}
              maxHeight={300}
              labelField="label"
              valueField="value"
              itemTextStyle={styles.dropDownItemText}
              itemContainerStyle={styles.dropdownItemContainer}
              containerStyle={styles.dropDownListContainer}
              placeholder={t("selectWallet")}
              value={transaction.walletId}
              onChange={(item) => {
                setTransactionData({
                  ...transaction,
                  walletId: item.value || "",
                })
              }}
            />
          </View>

          {/* expense category Container */}
          {transaction.type === "expense" && (
            <View style={styles.inputContainer}>
              <Typo color={colors.neutral200} size={16}>
                {t("expenseCategory")}
              </Typo>
              {/* drop down input */}
              <Dropdown
                style={styles.dropDownContainer}
                activeColor={colors.neutral700}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropDownSelectedText}
                iconStyle={styles.dropDownIcon}
                data={Object.values(getExpenseCategories(t))}
                maxHeight={300}
                labelField="label"
                valueField="value"
                itemTextStyle={styles.dropDownItemText}
                itemContainerStyle={styles.dropdownItemContainer}
                containerStyle={styles.dropDownListContainer}
                placeholder={t("selectCategory")}
                value={transaction.category}
                onChange={(item) => {
                  setTransactionData({
                    ...transaction,
                    category: item.value || "",
                  })
                }}
              />
            </View>
          )}

          {/* input Container end */}

          {/* Date picker */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              {t("date")}
            </Typo>
            {!showDatePicker && (
              <Pressable
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Typo size={14}>
                  {(transaction.date as Date).toLocaleDateString()}
                </Typo>
              </Pressable>
            )}
            {showDatePicker && (
              <View style={Platform.OS === "ios" && styles.iosDatePicker}>
                <DateTimePicker
                  themeVariant="dark"
                  value={transaction.date as Date}
                  textColor={colors.white}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onDateChange}
                />
                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Typo size={15} color={colors.primary} fontWeight={"500"}>
                      {t("confirmBtn")}
                    </Typo>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* amount expense - income */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              {t("amount")}
            </Typo>
            <TextInputComponent
              keyboardType="numeric"
              value={transaction.amount?.toString()}
              onChangeText={(value) =>
                setTransactionData({
                  ...transaction,
                  amount: Number(value.replace(/[^0-9]/g, "")),
                })
              }
            />
          </View>

          {/* description of transaction */}

          <View style={styles.inputContainer}>
            <View style={styles.flexRow}>
              <Typo color={colors.neutral200} size={16}>
                {t("description")}
              </Typo>
              <Typo color={colors.neutral500} size={14}>
                {" "}
                {t("optional")}
              </Typo>
            </View>
            <TextInputComponent
              value={transaction.description}
              multiline
              containerStyle={styles.transactionDesc}
              onChangeText={(value) =>
                setTransactionData({
                  ...transaction,
                  description: value,
                })
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.flexRow}>
              <Typo color={colors.neutral200} size={16}>
                {t("receipt")}
              </Typo>
              <Typo color={colors.neutral500} size={14}>
                {" "}
                {t("optional")}
              </Typo>
            </View>
            {/* Image input */}
            <ImageUpload
              file={transaction.image}
              onSelect={(file) =>
                setTransactionData({ ...transaction, image: file })
              }
              onClear={() =>
                setTransactionData({ ...transaction, image: null })
              }
              placeholder={t("addImage")}
            />
          </View>
          {feedback && (
            <View style={[styles.feedback, { backgroundColor: feedback.type === "success" ? "#16a34a20" : "#ef444420", borderColor: feedback.type === "success" ? "#16a34a" : "#ef4444" }]}>
              <Typo size={14} color={feedback.type === "success" ? "#16a34a" : "#ef4444"} style={{ textAlign: "center" }}>{feedback.msg}</Typo>
            </View>
          )}
        </ScrollView>
      </View>
      {/* footer area*/}
      <View style={styles.footer}>
        {oldTransaction?.id && !loading && (
          <ButtonComponent
            onPress={showDeleteAlert}
            style={{
              backgroundColor: colors.rose,
              paddingHorizontal: spacingX._15,
            }}
          >
            <Icons.Trash
              color={colors.white}
              size={verticalScale(24)}
              weight="bold"
            />
          </ButtonComponent>
        )}
        <ButtonComponent
          onPress={onSubmit}
          loading={loading}
          style={{ flex: 1 }}
        >
          <Typo color={colors.white} fontWeight={"800"}>
            {oldTransaction?.id ? t("update") : t("submit")}
          </Typo>
        </ButtonComponent>
      </View>
      <ConfirmDialog
        visible={confirmVisible}
        title={t("deleteTransaction")}
        message={t("deleteTransactionMsg")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        destructive
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => {
          setConfirmVisible(false);
          OnDelete();
        }}
      />
    </ModalWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingY._20,
  },
  form: {
    gap: spacingY._20,
    paddingVertical: spacingY._15,
    paddingBottom: spacingY._40,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingX._15,
    borderTopColor: colors.neutral700,
    borderTopWidth: 1,
  },
  inputContainer: {
    gap: spacingY._10,
  },
  androidDropDown: {
    height: verticalScale(54),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    fontSize: verticalScale(14),
    color: colors.white,
    borderColor: colors.neutral350,
    borderRadius: radius._17,
    borderCurve: "continuous",
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._5,
  },
  dateInput: {
    flexDirection: "row",
    height: verticalScale(54),
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.neutral350,
    borderRadius: radius._17,
    borderCurve: "continuous",
    paddingHorizontal: spacingX._15,
  },
  iosDatePicker: {},
  datePickerButton: {
    backgroundColor: colors.neutral700,
    alignSelf: "flex-end",
    padding: spacingY._7,
    marginRight: spacingX._7,
    paddingHorizontal: spacingY._15,
    borderRadius: radius._10,
  },
  dropDownContainer: {
    height: verticalScale(54),
    borderWidth: 1,
    borderColor: colors.neutral350,
    paddingHorizontal: spacingX._15,
    borderRadius: radius._15,
    borderCurve: "continuous",
  },
  dropDownItemText: {
    color: colors.white,
  },
  dropDownSelectedText: {
    color: colors.white,
    fontSize: verticalScale(14),
  },
  dropDownListContainer: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    borderCurve: "continuous",
    paddingVertical: spacingY._7,
    top: 5,
    borderColor: colors.neutral500,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
  },
  dropdownPlaceholder: {
    color: colors.white,
  },
  dropdownItemContainer: {
    borderRadius: radius._15,
    marginHorizontal: spacingX._7,
  },
  dropDownIcon: {
    height: verticalScale(30),
    tintColor: colors.neutral350,
  },
  transactionDesc: {
    flexDirection: "row",
    height: verticalScale(100),
    alignItems: "flex-start",
    paddingVertical: 15,
  },
  feedback: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 4 },
})

export default TransactionModal
