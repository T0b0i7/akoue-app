import CustomTabs from "@/components/custom-tabs"
import { useLocale } from "@/context/locale-context"
import { useAuth } from "@/context/auth-context"
import { Tabs } from "expo-router"
import React from "react"

export default function Layout() {
  const { user } = useAuth()
  const { t } = useLocale()
  if (!user) {
    return null
  }
  return (
    <Tabs tabBar={CustomTabs} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{title: t("home")}}></Tabs.Screen>
      <Tabs.Screen name="statistics" options={{title: t("statisticsTab")}}></Tabs.Screen>
      <Tabs.Screen name="wallet" options={{title: t("walletTab")}}></Tabs.Screen>
      <Tabs.Screen name="more" options={{title: t("more")}}></Tabs.Screen>
    </Tabs>
  )
}

// const styles = StyleSheet.create({})
