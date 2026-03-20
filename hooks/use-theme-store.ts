"use client"

import { useState, useEffect, useCallback } from "react"
import { DEFAULT_THEME } from "@/lib/themes"

const STORAGE_KEY = "app-theme"

export function useThemeStore() {
  const [theme, setThemeState] = useState(DEFAULT_THEME)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setThemeState(stored)
      document.documentElement.setAttribute("data-theme", stored)
    }
    setMounted(true)
  }, [])

  const setTheme = useCallback((newTheme: string) => {
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)
  }, [])

  return { theme, setTheme, mounted }
}
