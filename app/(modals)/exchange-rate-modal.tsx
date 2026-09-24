import BackButton from "@/components/back-button"
import Header from "@/components/header"
import Input from "@/components/input"
import Loading from "@/components/loading"
import ModalWrapper from "@/components/modal-wrapper"
import Typo from "@/components/typo"
import { colors, radius, spacingX, spacingY } from "@/constants/theme"
import { fetchCurrencies } from "@/services/currency-service"
import { CurrencyType } from "@/types"  
import {
  formatCurrency,
  formatNumberInput,
  getNumberInput,
} from "@/utils/common"
import { verticalScale } from "@/utils/styling"
import * as Icons from "phosphor-react-native"
import { useLocale } from "@/context/locale-context"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { AppState, Platform, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native"
import { Dropdown } from "react-native-element-dropdown"
import Animated, { FadeInDown } from "react-native-reanimated"

const ExchangeRateModal = () => {
  const { t } = useLocale()
  const [currencies, setCurrencies] = useState<CurrencyType[]>([])
  const [baseCurrency, setBaseCurrency] = useState<string>("EUR")
  const [amount, setAmount] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [live, setLive] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selected, setSelected] = useState<CurrencyType | null>(null)

  const fetchData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true)
      const response = await fetchCurrencies(baseCurrency)
      setCurrencies(response)
      setLastUpdate(new Date())
      setLive(true)
    } catch (error) {
      setLive(false)
    } finally {
      if (showLoader) setLoading(false)
      setRefreshing(false)
    }
  }, [baseCurrency])

  useEffect(() => {
    fetchData(true)
  }, [fetchData])

  // temps réel : polling 60s + au retour AppState active
  useEffect(() => {
    const id = setInterval(() => fetchData(false), 60000)
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") fetchData(false)
    })
    return () => {
      clearInterval(id)
      sub.remove()
    }
  }, [fetchData])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchData(false)
  }, [fetchData])

  const filteredCurrencies = useMemo(() => {
    return currencies.filter(
      (currency) =>
        currency.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        currency.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [currencies, searchQuery])

  const handleAmountChange = (value: string) => {
    const numericValue = getNumberInput(value)
    if (numericValue !== undefined) {
      setAmount(numericValue.toString())
    }
  }

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={t("exchangeRate")}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        <ScrollView
          contentContainerStyle={styles.scrollViewStyle}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {/* Currency Selection */}
          <View style={styles.inputContainer}>
            <Typo size={16} fontWeight="600" color={colors.neutral200}>
              {t("selectCurrency")}
            </Typo>
            <Dropdown
              style={styles.dropdownContainer}
              activeColor={colors.neutral700}
              selectedTextStyle={styles.dropdownSelectedItem}
              iconStyle={styles.dropdownIcon}
              data={currencies.map((currency) => ({
                label: `${currency.code} - ${currency.name}`,
                value: currency.code,
              }))}
              maxHeight={300}
              labelField="label"
              valueField="value"
              itemTextStyle={styles.dropdownItemText}
              itemContainerStyle={styles.dropdownItemContainer}
              containerStyle={styles.dropdownListContainer}
              placeholderStyle={styles.dropdownPlaceholder}
              value={baseCurrency}
              onChange={(item) => setBaseCurrency(item.value)}
            />
          </View>

          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <Typo size={16} fontWeight="600" color={colors.neutral200}>
              {t("amount")}
            </Typo>
            <Input
              value={formatNumberInput(amount)}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder={t("enterAmount")}
              type="normal"
            />
          </View>

          {/* Search */}
          <View style={styles.inputContainer}>
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("searchCurrency")}
              type="normal"
              icon={
                <Icons.MagnifyingGlass size={20} color={colors.neutral400} />
              }
            />
          </View>

          {/* Conversion List */}
          <View style={styles.inputContainer}>
            <View style={styles.listHeader}>
              <View style={{ gap: 2 }}>
                <Typo size={16} fontWeight="600" color={colors.neutral200}>
                  {t("conversionResult")}
                </Typo>
                {lastUpdate && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <View style={[styles.liveDot, { backgroundColor: live ? colors.green : colors.neutral500 }]} />
                    <Typo size={11} color={colors.neutral500}>
                      {live ? "Temps réel" : "Hors ligne"} • {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </Typo>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => fetchData(false)} style={styles.refreshBtn} activeOpacity={0.7}>
                <Icons.ArrowsClockwise size={16} color={colors.white} weight="bold" />
                <Typo size={12} fontWeight="600" color={colors.white}>
                  Actualiser
                </Typo>
              </TouchableOpacity>
            </View>
            <View style={styles.listContainer}>
              {filteredCurrencies.map((currency, index) => {
                const isSelected = selected?.code === currency.code;
                return (
                <Animated.View
                  key={currency.code}
                  entering={FadeInDown.delay(index * 50)
                    .springify()
                    .damping(50)}
                >
                  <TouchableOpacity
                    onPress={() => setSelected(isSelected ? null : currency)}
                    activeOpacity={0.7}
                    style={[styles.currencyItem, isSelected && { backgroundColor: colors.neutral700 }]}
                  >
                    <View style={styles.currencyInfo}>
                      <Typo size={17} fontWeight="500">
                        {currency.code}
                      </Typo>
                      <Typo size={14} color={colors.neutral400}>
                        {currency.name}
                      </Typo>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 2 }}>
                      <Typo size={17} fontWeight="500" color={colors.green}>
                        {formatCurrency(
                          Number(amount) * currency.value,
                          "vi-VN",
                          currency.code,
                          6,
                        )}
                      </Typo>
                      <Typo size={11} color={colors.neutral500}>
                        1 {baseCurrency} = {currency.value.toFixed(4)} {currency.code}
                      </Typo>
                    </View>
                  </TouchableOpacity>
                  {isSelected && (
                    <View style={styles.detailBox}>
                      <View style={styles.detailRow}>
                        <Typo size={12} color={colors.neutral400}>1 {currency.code} =</Typo>
                        <Typo size={13} fontWeight="600" color={colors.white}>{(1 / currency.value).toFixed(6)} {baseCurrency}</Typo>
                      </View>
                      <View style={styles.detailRow}>
                        <Typo size={12} color={colors.neutral400}>Valeur unitaire</Typo>
                        <Typo size={13} fontWeight="600" color={colors.primary}>{currency.value.toFixed(6)} {currency.code}</Typo>
                      </View>
                      <Typo size={11} color={colors.neutral500} style={{ marginTop: 6, textAlign: "center" }}>Tape pour fermer • Montant x taux temps réel</Typo>
                    </View>
                  )}
                  {index < filteredCurrencies.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </Animated.View>
                );
              })}

              {loading ? (
                <Loading />
              ) : (
                filteredCurrencies.length === 0 && (
                  <Typo
                    size={15}
                    color={colors.neutral400}
                    style={{ textAlign: "center", marginTop: spacingY._15 }}
                  >
                    {t("noCurrency")}
                  </Typo>
                )
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </ModalWrapper>
  )
}

export default ExchangeRateModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  scrollViewStyle: {
    gap: spacingY._15,
    paddingBottom: verticalScale(100),
  },
  inputContainer: {
    gap: spacingY._10,
  },
  dropdownContainer: {
    height: verticalScale(54),
    borderWidth: 1,
    borderColor: colors.neutral350,
    paddingHorizontal: spacingX._15,
    borderRadius: radius._15,
    borderCurve: "continuous",
  },
  dropdownSelectedItem: {
    color: colors.white,
    fontWeight: "500",
  },
  dropdownItemText: {
    color: colors.white,
  },
  dropdownPlaceholder: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "500",
  },
  dropdownListContainer: {
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
  dropdownItemContainer: {
    borderRadius: radius._15,
    marginHorizontal: spacingX._7,
  },
  dropdownIcon: {
    height: verticalScale(30),
    tintColor: colors.neutral350,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._10,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.neutral700,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  listContainer: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._15,
    overflow: "hidden",
  },
  currencyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._15,
    backgroundColor: colors.neutral800,
  },
  currencyInfo: {
    gap: spacingY._5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral700,
    marginHorizontal: spacingX._15,
  },
  detailBox: {
    backgroundColor: colors.neutral900,
    marginHorizontal: spacingX._15,
    marginVertical: spacingY._10,
    borderRadius: radius._12,
    padding: spacingX._12,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
})
