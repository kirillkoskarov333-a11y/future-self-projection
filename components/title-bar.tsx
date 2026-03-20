"use client"

import { Minus, Square, X } from "lucide-react"

// Type declaration for electronAPI exposed from preload
declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void
      maximize: () => void
      close: () => void
    }
    desktop?: {
      isDesktop: boolean
      platform: string
    }
  }
}

export function TitleBar() {
  // Only show in Electron (desktop app)
  const isDesktop = typeof window !== "undefined" && window.desktop?.isDesktop

  if (!isDesktop) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex h-9 items-center justify-between bg-[#0a0a0a] select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* App title on the left */}
      <div className="flex items-center gap-2 pl-4">
        <span className="text-xs font-medium text-zinc-400">
          Future Self Projection
        </span>
      </div>

      {/* Window control buttons on the right */}
      <div
        className="flex h-full"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {/* Minimize */}
        <button
          onClick={() => window.electronAPI?.minimize()}
          className="flex h-full w-12 items-center justify-center text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200"
        >
          <Minus size={16} />
        </button>

        {/* Maximize / Restore */}
        <button
          onClick={() => window.electronAPI?.maximize()}
          className="flex h-full w-12 items-center justify-center text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200"
        >
          <Square size={13} />
        </button>

        {/* Close */}
        <button
          onClick={() => window.electronAPI?.close()}
          className="flex h-full w-12 items-center justify-center text-zinc-400 transition-colors hover:bg-red-500 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
