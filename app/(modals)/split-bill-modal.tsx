import BackButton from "@/components/back-button"
import Header from "@/components/header"
import Input from "@/components/input"
import ModalWrapper from "@/components/modal-wrapper"
import Typo from "@/components/typo"
import { colors, radius, spacingX, spacingY } from "@/constants/theme"
import { formatCurrency } from "@/utils/common"
import { verticalScale } from "@/utils/styling"
import * as Icons from "phosphor-react-native"
import React, { useMemo, useState } from "react"
import { ScrollView, StyleSheet, View } from "react-native"

const SplitBillModal = () => {
  const [total, setTotal] = useState("50000")
  const [people, setPeople] = useState("4")

  const totalNum = Number(total.replace(/\s/g, "")) || 0
  const peopleNum = Number(people) || 1

  const result = useMemo(() => {
    if (!totalNum || !peopleNum) return null
    const perPerson = totalNum / peopleNum
    return { perPerson }
  }, [totalNum, peopleNum])

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header title="Partager l'addition" leftIcon={<BackButton />} style={{ marginBottom: spacingY._10 }} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.inputContainer}>
            <Typo size={15} fontWeight="600" color={colors.neutral200}>Montant total (XOF)</Typo>
            <Input value={total} onChangeText={setTotal} keyboardType="numeric" placeholder="50 000" type="normal" />
          </View>
          <View style={styles.inputContainer}>
            <Typo size={15} fontWeight="600" color={colors.neutral200}>Nombre de personnes</Typo>
            <Input value={people} onChangeText={setPeople} keyboardType="numeric" placeholder="4" type="normal" />
          </View>
          {result ? (
            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <View style={[styles.iconBox, { backgroundColor: "#6366f1" }]}>
                  <Icons.UsersThree size={22} color="#fff" weight="fill" />
                </View>
                <View style={{ flex: 1 }}>
                  <Typo size={13} color={colors.neutral400}>Par personne</Typo>
                  <Typo size={24} fontWeight="800" color={colors.primary}>{formatCurrency(result.perPerson, "fr-FR", "XOF", 0)}</Typo>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Typo size={14} color={colors.neutral400}>Total</Typo>
                <Typo size={15} fontWeight="600">{formatCurrency(totalNum, "fr-FR", "XOF", 0)}</Typo>
              </View>
              <View style={styles.row}>
                <Typo size={14} color={colors.neutral400}>Détail</Typo>
                <Typo size={14} color={colors.neutral200}>{totalNum.toLocaleString("fr-FR")} ÷ {peopleNum} pers.</Typo>
              </View>
              <View style={styles.helpBox}>
                <Typo size={12} color={colors.neutral400}>💡 Chacun paye le même montant.</Typo>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Typo size={14} color={colors.neutral400} style={{ textAlign: "center" }}>Remplis le montant et le nombre de personnes</Typo>
            </View>
          )}
        </ScrollView>
      </View>
    </ModalWrapper>
  )
}
export default SplitBillModal
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacingX._20 },
  scroll: { gap: spacingY._15, paddingBottom: verticalScale(40) },
  inputContainer: { gap: spacingY._10 },
  resultCard: { backgroundColor: colors.neutral800, borderRadius: radius._15, padding: spacingX._15, gap: spacingY._12, marginTop: spacingY._10 },
  resultRow: { flexDirection: "row", alignItems: "center", gap: spacingX._12 },
  iconBox: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, backgroundColor: colors.neutral700 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  helpBox: { backgroundColor: colors.neutral900, borderRadius: 10, padding: 10, marginTop: 4 },
  emptyCard: { backgroundColor: colors.neutral800, borderRadius: radius._15, padding: spacingY._20, marginTop: spacingY._10 },
})
