import AsyncStorage from "@react-native-async-storage/async-storage"
import React, { createContext, useContext, useEffect } from "react"
import { colors } from "@/constants/theme"

// Snapshot du theme sombre d'origine : ne mute jamais
const darkColors = { ...colors } as typeof colors

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
  // Mode sombre uniquement pour l'instant : light desactive sur demande
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
