"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Palette, Check, X, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { THEMES, type ThemeConfig } from "@/lib/themes"
import { useThemeStore } from "@/hooks/use-theme-store"

function ThemeCard({
  themeConfig,
  isActive,
  onSelect,
}: {
  themeConfig: ThemeConfig
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
        isActive
          ? "bg-primary/10 ring-1 ring-primary/30 border border-primary/20"
          : "hover:bg-secondary/50 border border-transparent hover:border-border/30"
      }`}
    >
      {/* Mini preview swatch */}
      <div
        className="w-9 h-9 rounded-lg shrink-0 overflow-hidden flex flex-col border"
        style={{
          background: themeConfig.previewColors.bg,
          borderColor: isActive
            ? themeConfig.previewColors.primary
            : "transparent",
        }}
      >
        <div className="flex-1 flex items-end justify-center pb-0.5">
          <div
            className="w-5 h-1.5 rounded-full"
            style={{ background: themeConfig.previewColors.primary }}
          />
        </div>
        <div
          className="h-3 w-full"
          style={{ background: themeConfig.previewColors.secondary }}
        />
      </div>

      {/* Text */}
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-foreground leading-tight truncate">
          {themeConfig.nameRu}
        </span>
        <span className="text-[10px] text-muted-foreground leading-tight truncate">
          {themeConfig.description}
        </span>
      </div>

      {/* Status indicators */}
      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        {themeConfig.isDark ? (
          <Moon className="w-3 h-3 text-muted-foreground" />
        ) : (
          <Sun className="w-3 h-3 text-muted-foreground" />
        )}
        {isActive && (
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
            <Check className="w-3 h-3 text-primary" />
          </div>
        )}
      </div>
    </button>
  )
}

export function ThemeSwitcher() {
  const { theme, setTheme, mounted } = useThemeStore()
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const closePanel = useCallback(() => setIsOpen(false), [])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen, closePanel])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        closePanel()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [isOpen, closePanel])

  if (!mounted) return null

  const currentTheme = THEMES.find((t) => t.id === theme)

  return (
    <>
      {/* Trigger button */}
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-200 ${
          isOpen ? "bg-secondary/60 text-foreground" : ""
        }`}
        aria-label="Switch theme"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Palette className="h-4 w-4" />
        {currentTheme && (
          <span className="hidden sm:inline text-xs font-medium">
            {currentTheme.nameRu}
          </span>
        )}
      </Button>

      {/* Overlay + Panel -- rendered via portal-like fixed positioning */}
      {isOpen && (
        <div className="fixed inset-0 z-[100]" aria-modal="true" role="dialog">
          {/* Transparent backdrop for catching clicks */}
          <div
            className="absolute inset-0 bg-background/50 backdrop-blur-sm transition-opacity duration-200"
            onClick={closePanel}
            aria-hidden="true"
          />

          {/* Floating panel -- centered on mobile, anchored top-right on desktop */}
          <div
            ref={panelRef}
            className="absolute inset-x-4 top-20 sm:inset-x-auto sm:top-16 sm:right-6 sm:w-[380px] max-h-[calc(100vh-8rem)] flex flex-col rounded-2xl animate-scale-in overflow-hidden"
            style={{
              zIndex: 101,
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              boxShadow: "0 24px 48px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(var(--glass-bg), 0.06)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground leading-tight">
                    Тема оформления
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Выберите цветовую схему
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closePanel}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Theme list -- scrollable */}
            <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5 scrollbar-thin">
              {THEMES.map((t) => (
                <ThemeCard
                  key={t.id}
                  themeConfig={t}
                  isActive={theme === t.id}
                  onSelect={() => {
                    setTheme(t.id)
                  }}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 shrink-0 flex items-center justify-between border-t border-border/40">
              <p className="text-[10px] text-muted-foreground">
                Настройки сохраняются автоматически
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={closePanel}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                Готово
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
