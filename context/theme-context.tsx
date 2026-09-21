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
  const [theme, setThemeState] = useState<ThemeType>("dark")

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === "light" || v === "dark") setThemeState(v)
      else {
        const sys = Appearance.getColorScheme()
        if (sys === "light") setThemeState("light")
      }
    })
  }, [])

  const setTheme = async (t: ThemeType) => {
    setThemeState(t)
    await AsyncStorage.setItem(STORAGE_KEY, t)
  }
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

  const colorsTheme = theme === "dark" ? darkColors : (lightColors as typeof darkColors)

  // Mutate l'objet colors importé pour que les `import { colors }` existants reflètent le thème
  Object.assign(colors, colorsTheme)

  return <ThemeContext.Provider value={{ isDark: theme === "dark", theme, colors: colorsTheme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be within ThemeProvider")
  return ctx
}
