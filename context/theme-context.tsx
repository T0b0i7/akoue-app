import AsyncStorage from "@react-native-async-storage/async-storage"
import React, { createContext, useContext, useEffect, useState } from "react"
import { Appearance } from "react-native"
import { colors as darkColors, colors } from "@/constants/theme"

const lightColors = {
  ...darkColors,
  neutral900: "#f8fafc",
  neutral800: "#ffffff",
  neutral700: "#e2e8f0",
  neutral600: "#cbd5e1",
  neutral500: "#94a3b8",
  neutral400: "#64748b",
  neutral350: "#475569",
  neutral100: "#0f172a",
  neutral50: "#ffffff",
  black: "#ffffff",
  white: "#0f172a",
  text: "#0f172a",
  textLight: "#1e293b",
  textLighter: "#334155",
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
