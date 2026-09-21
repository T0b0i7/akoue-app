import AsyncStorage from "@react-native-async-storage/async-storage"
import React, { createContext, useContext, useEffect, useState } from "react"
import { Appearance } from "react-native"
import { colors } from "@/constants/theme"

// Snapshot du thème sombre d'origine — ne mute jamais
const darkColors = { ...colors } as typeof colors

const lightColors = {
  ...darkColors,
  // Soft Structuralism — airy, floating, diffused
  neutral900: "#f8fafc", // page bg — très clair
  neutral800: "#ffffff", // card — blanc pur
  neutral700: "#e2e8f0", // border hairline
  neutral600: "#cbd5e1",
  neutral500: "#94a3b8",
  neutral400: "#64748b",
  neutral350: "#475569",
  neutral100: "#0f172a", // texte principal sombre
  neutral50: "#f1f5f9",
  // On garde white/black pour les CTA (texte blanc sur primaire reste blanc)
  black: "#000000",
  white: "#FFFFFF",
  text: "#0f172a",
  textLight: "#334155",
  textLighter: "#64748b",
}

type ThemeType = "light" | "dark"
type ThemeContextType = {
  isDark: boolean
  theme: ThemeType
  colors: typeof darkColors
  toggleTheme: () => void
  setTheme: (t: ThemeType) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)
const STORAGE_KEY = "app_theme"

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mode sombre uniquement pour l'instant — light désactivé sur demande
  const theme: ThemeType = "dark"
  const colorsTheme = darkColors

  // Force le stockage en sombre et nettoie l'ancienne valeur light
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, "dark")
    Object.assign(colors, darkColors)
  }, [])

  const setTheme = async () => {}
  const toggleTheme = () => {}

  Object.assign(colors, darkColors)

  return <ThemeContext.Provider value={{ isDark: true, theme, colors: colorsTheme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be within ThemeProvider")
  return ctx
}
