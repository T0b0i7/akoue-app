import BackButton from "@/components/back-button"
import Header from "@/components/header"
import Input from "@/components/input"
import ModalWrapper from "@/components/modal-wrapper"
import Typo from "@/components/typo"
import { colors, radius, spacingX, spacingY } from "@/constants/theme"
import { useLocale } from "@/context/locale-context"
import { formatCurrency } from "@/utils/common"
import { verticalScale } from "@/utils/styling"
import * as Icons from "phosphor-react-native"
import React, { useMemo, useState } from "react"
import { ScrollView, StyleSheet, View } from "react-native"

const LoanCalculatorModal = () => {
  const { t } = useLocale()
  const [amount, setAmount] = useState("1000000")
  const [rate, setRate] = useState("7")
  const [months, setMonths] = useState("12")

  const principal = Number(amount.replace(/\s/g, "")) || 0
  const annualRate = Number(rate.replace(",", ".")) || 0
  const duration = Number(months) || 0

  const result = useMemo(() => {
    if (!principal || !annualRate || !duration) return null
    const r = annualRate / 100 / 12
    const n = duration
    const m = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    const total = m * n
    const interest = total - principal
    return { monthly: m, total, interest }
  }, [principal, annualRate, duration])

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header title={t("loanCalculator")} leftIcon={<BackButton />} style={{ marginBottom: spacingY._10 }} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.inputContainer}>
            <Typo size={15} fontWeight="600" color={colors.neutral200}>Montant du prêt (XOF)</Typo>
            <Input value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="1 000 000" type="normal" />
          </View>

          <View style={styles.inputContainer}>
            <Typo size={15} fontWeight="600" color={colors.neutral200}>Taux annuel (%)</Typo>
            <Input value={rate} onChangeText={setRate} keyboardType="numeric" placeholder="7" type="normal" />
          </View>

          <View style={styles.inputContainer}>
            <Typo size={15} fontWeight="600" color={colors.neutral200}>Durée (mois)</Typo>
            <Input value={months} onChangeText={setMonths} keyboardType="numeric" placeholder="12" type="normal" />
          </View>

          {result ? (
            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <View style={[styles.iconBox, { backgroundColor: "#7A4DFF" }]}>
                  <Icons.Calendar size={20} color="#fff" weight="fill" />
                </View>
                <View style={{ flex: 1 }}>
                  <Typo size={13} color={colors.neutral400}>Mensualité</Typo>
                  <Typo size={20} fontWeight="700">{formatCurrency(result.monthly, "fr-FR", "XOF", 0)}</Typo>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.resultRow}>
                <View style={[styles.iconBox, { backgroundColor: "#0ea5e9" }]}>
                  <Icons.Coins size={20} color="#fff" weight="fill" />
                </View>
                <View style={{ flex: 1 }}>
                  <Typo size={13} color={colors.neutral400}>Total payé</Typo>
                  <Typo size={17} fontWeight="600">{formatCurrency(result.total, "fr-FR", "XOF", 0)}</Typo>
                </View>
              </View>
              <View style={styles.resultRow}>
                <View style={[styles.iconBox, { backgroundColor: "#f59e0b" }]}>
                  <Icons.Percent size={20} color="#fff" weight="fill" />
                </View>
                <View style={{ flex: 1 }}>
                  <Typo size={13} color={colors.neutral400}>Intérêts totaux</Typo>
                  <Typo size={17} fontWeight="600" color={colors.rose}>{formatCurrency(result.interest, "fr-FR", "XOF", 0)}</Typo>
                </View>
              </View>
              <View style={styles.formulaBox}>
                <Typo size={12} color={colors.neutral400}>Formule: M = P·r·(1+r)^n / ((1+r)^n -1) • r=taux mensuel, n=mois</Typo>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Typo size={14} color={colors.neutral400} style={{ textAlign: "center" }}>Remplis les 3 champs pour voir le calcul</Typo>
            </View>
          )}
        </ScrollView>
      </View>
    </ModalWrapper>
  )
}

export default LoanCalculatorModal

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacingX._20 },
  scroll: { gap: spacingY._15, paddingBottom: verticalScale(40) },
  inputContainer: { gap: spacingY._10 },
  resultCard: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._15,
    padding: spacingX._15,
    gap: spacingY._12,
    marginTop: spacingY._10,
  },
  resultRow: { flexDirection: "row", alignItems: "center", gap: spacingX._12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, backgroundColor: colors.neutral700 },
  formulaBox: { backgroundColor: colors.neutral900, borderRadius: 10, padding: 10, marginTop: 4 },
  emptyCard: { backgroundColor: colors.neutral800, borderRadius: radius._15, padding: spacingY._20, marginTop: spacingY._10 },
})
