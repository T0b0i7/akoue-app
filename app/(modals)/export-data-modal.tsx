import BackButton from "@/components/back-button"
import ButtonComponent from "@/components/button"
import Header from "@/components/header"
import ModalWrapper from "@/components/modal-wrapper"
import Typo from "@/components/typo"
import { colors, radius, spacingX, spacingY } from "@/constants/theme"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/config/supabase"
import { verticalScale } from "@/utils/styling"
import * as FileSystem from "expo-file-system/legacy"
import * as Sharing from "expo-sharing"
import * as Icons from "phosphor-react-native"
import React, { useState } from "react"
import { Alert, Platform, ScrollView, StyleSheet, View } from "react-native"

const ExportDataModal = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState<"csv" | "json" | null>(null)

  const fetchData = async () => {
    if (!user?.uid) throw new Error("Non connecté")
    const { data: wallets } = await supabase.from("wallets").select("*").eq("uid", user.uid)
    const { data: txs } = await supabase.from("transactions").select("*").eq("uid", user.uid).order("date", { ascending: false })
    return { wallets: wallets || [], txs: txs || [] }
  }

  const sanitizeCsvField = (v: string) => {
    const s = String(v || "");
    // neutralise l'injection de formule Excel (=, +, -, @, |, %)
    if (/^[=+\-@|\t\r%]/ .test(s)) return `'${s}`;
    return s;
  };
  const csvEscape = (v: string) => `"${sanitizeCsvField(v).replace(/"/g, '""')}"`;
  const toCSV = (wallets: any[], txs: any[]) => {
    const walletMap = new Map(wallets.map((w: any) => [w.id, w.name]))
    const lines = ["id,type,amount,category,description,date,wallet,walletId"]
    for (const t of txs) {
      const row = [
        t.id,
        String(t.type).replace(/[^a-z]/g, ""),
        String(Number(t.amount) || 0),
        csvEscape(t.category || ""),
        csvEscape(t.description || ""),
        new Date(t.date).toISOString().slice(0, 10),
        csvEscape(walletMap.get(t.walletId) || ""),
        String(t.walletId || "").replace(/[^a-z0-9\-]/gi, ""),
      ].join(",")
      lines.push(row)
    }
    lines.push("")
    lines.push("WALLETS")
    lines.push("id,name,amount,totalIncome,totalExpenses,created_at")
    for (const w of wallets) {
      lines.push([String(w.id).replace(/[^a-z0-9\-]/gi, ""), csvEscape(w.name), String(Number(w.amount) || 0), String(Number(w.totalIncome) || 0), String(Number(w.totalExpenses) || 0), String(w.created_at || "")].join(","))
    }
    return lines.join("\n")
  }

  const saveAndShare = async (content: string, filename: string, mime: string) => {
    if (Platform.OS === "web") {
      const blob = new Blob([content], { type: mime })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
      Alert.alert("Exporté", `${filename} téléchargé`)
      return
    }
    const path = FileSystem.documentDirectory + filename
    await FileSystem.writeAsStringAsync(path, content, { encoding: FileSystem.EncodingType.UTF8 })
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: mime, dialogTitle: filename })
    } else {
      Alert.alert("Exporté", `Fichier enregistré : ${path}`)
    }
  }

  const handleCSV = async () => {
    try {
      setLoading("csv")
      const { wallets, txs } = await fetchData()
      if (!txs.length && !wallets.length) { Alert.alert("Export", "Aucune donnée à exporter"); return }
      const csv = toCSV(wallets, txs)
      await saveAndShare(csv, `akoue-export-${new Date().toISOString().slice(0,10)}.csv`, "text/csv")
    } catch (e: any) { Alert.alert("Erreur", e.message) } finally { setLoading(null) }
  }

  const handleJSON = async () => {
    try {
      setLoading("json")
      const { wallets, txs } = await fetchData()
      const json = JSON.stringify({ exportedAt: new Date().toISOString(), user: { uid: user?.uid, email: user?.email }, wallets, transactions: txs }, null, 2)
      await saveAndShare(json, `akoue-backup-${new Date().toISOString().slice(0,10)}.json`, "application/json")
    } catch (e: any) { Alert.alert("Erreur", e.message) } finally { setLoading(null) }
  }

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header title="Exporter les données" leftIcon={<BackButton />} style={{ marginBottom: spacingY._10 }} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.iconBox}><Icons.FileArrowUp size={26} color="#fff" weight="fill" /></View>
            <Typo size={16} fontWeight="600">Tes données t'appartiennent</Typo>
            <Typo size={13} color={colors.neutral400} style={{ textAlign: "center", lineHeight: 18 }}>Exporte tous tes portefeuilles et transactions. Fichier compatible Excel / Google Sheets. Fonctionne même hors ligne.</Typo>
          </View>

          <View style={styles.actions}>
            <ButtonComponent onPress={handleCSV} loading={loading==="csv"} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" } as any}>
              <Icons.Table size={20} color="#fff" weight="bold" />
              <Typo color="#fff" fontWeight="700"> Exporter en CSV</Typo>
            </ButtonComponent>
            <Typo size={12} color={colors.neutral500} style={{ textAlign: "center" }}>Idéal pour Excel — colonnes : date, type, montant, catégorie, portefeuille</Typo>

            <ButtonComponent onPress={handleJSON} loading={loading==="json"} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: colors.neutral700 } as any}>
              <Icons.Code size={20} color="#fff" weight="bold" />
              <Typo color="#fff" fontWeight="700"> Exporter en JSON</Typo>
            </ButtonComponent>
            <Typo size={12} color={colors.neutral500} style={{ textAlign: "center" }}>Sauvegarde complète — wallets + transactions</Typo>
          </View>

          <View style={styles.help}>
            <Typo size={12} color={colors.neutral400}>📁 Sur mobile : choisis WhatsApp, Drive, Mail... Sur web : téléchargement direct.</Typo>
          </View>
        </ScrollView>
      </View>
    </ModalWrapper>
  )
}
export default ExportDataModal
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacingX._20 },
  scroll: { gap: spacingY._15, paddingBottom: verticalScale(40) },
  card: { backgroundColor: colors.neutral800, borderRadius: radius._15, padding: spacingX._15, alignItems: "center", gap: 8 },
  iconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#0ea5e9", alignItems: "center", justifyContent: "center" },
  actions: { gap: spacingY._10, marginTop: spacingY._10 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  help: { backgroundColor: colors.neutral900, borderRadius: 10, padding: 12, marginTop: 8 },
})
