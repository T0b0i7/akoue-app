import React, { createContext, useContext, useState, useCallback } from "react"

type ToastType = "success" | "error" | "info"
type ToastData = { id: number; type: ToastType; title: string; message?: string }

type ToastContextType = {
  showToast: (type: ToastType, title: string, message?: string) => void
  toast: ToastData | null
  hideToast: () => void
}

const ToastContext = createContext<ToastContextType | null>(null)
let counter = 0

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastData | null>(null)

  const hideToast = useCallback(() => setToast(null), [])

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++counter
    setToast({ id, type, title, message })
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 3200)
  }, [])

  return <ToastContext.Provider value={{ showToast, toast, hideToast }}>{children}</ToastContext.Provider>
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
