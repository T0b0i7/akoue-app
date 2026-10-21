import React, { createContext, useContext, useEffect, useState } from "react"
import { Platform } from "react-native"
import { useAudioPlayer } from "expo-audio"
import { usePathname } from "expo-router"

type AudioContextType = {
  muted: boolean
  toggleSound: () => void
}

const AudioContext = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [userMuted, setUserMuted] = useState(false)
  const pathname = usePathname()
  const welcomeScreenActive = /(?:^|\/)welcome(?:\/|$)/.test(pathname ?? "")
  const muted = userMuted || !welcomeScreenActive
  const player = useAudioPlayer(require("@/public/sounds/money-theme.wav"))

  useEffect(() => {
    if (muted) {
      player.pause()
      return
    }
    try {
      player.loop = true
      player.volume = 0.35
    } catch {}
    const start = () => {
      try {
        player.play()
      } catch {}
    }
    const id = setTimeout(start, 450)
    // Web : les navigateurs bloquent l'autoplay -> on demarre au 1er geste.
    let unlock: (() => void) | null = null
    if (Platform.OS === "web" && typeof document !== "undefined") {
      unlock = () => {
        start()
        document.removeEventListener("pointerdown", unlock!)
        document.removeEventListener("keydown", unlock!)
      }
      document.addEventListener("pointerdown", unlock)
      document.addEventListener("keydown", unlock)
    }
    return () => {
      clearTimeout(id)
      if (unlock) {
        document.removeEventListener("pointerdown", unlock)
        document.removeEventListener("keydown", unlock)
      }
    }
  }, [muted, player])

  const toggleSound = () => {
    if (!welcomeScreenActive) return
    const next = !userMuted
    setUserMuted(next)
    try {
      if (next) player.pause()
      else {
        player.loop = true
        player.play()
      }
    } catch {}
  }

  return (
    <AudioContext.Provider value={{ muted, toggleSound }}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error("useAudio must be used within AudioProvider")
  return ctx
}
