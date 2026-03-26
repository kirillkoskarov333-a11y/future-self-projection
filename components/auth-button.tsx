"use client"

import { useState, useEffect, useCallback } from "react"
import { LogIn, LogOut, Cloud, CloudOff, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { syncFromCloud, pushAllToCloud } from "@/lib/storage-client"
import type { User } from "@supabase/supabase-js"

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [syncMsg, setSyncMsg] = useState("") // sync feedback message

  // Check current session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => { listener.subscription.unsubscribe() }
  }, [])

  // Auto-sync: pull from cloud when page becomes visible (user opens app/tab)
  useEffect(() => {
    if (!user) return
    if (typeof window === "undefined") return

    // Sync once on mount (when app opens)
    handleSync()

    // Sync when user returns to the tab/app
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        console.log("[sync] Page visible — auto-syncing from cloud")
        handleSync()
      }
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => document.removeEventListener("visibilitychange", onVisible)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Sync after login
  const handleSync = useCallback(async () => {
    setSyncing(true)
    try {
      const result = await syncFromCloud()
      if (result === "pulled") {
        // Data was updated from cloud — reload page to refresh all hooks
        window.location.reload()
      }
    } catch (err) {
      console.error("[sync] Sync failed:", err)
    }
    setSyncing(false)
  }, [])

  // Login with email/password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setMessage("Проверь почту для подтверждения!")
        // Push local data to cloud on first signup
        await pushAllToCloud()
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setShowForm(false)
        setEmail("")
        setPassword("")
        // Sync data after login
        await handleSync()
      }
    }
    setLoading(false)
  }

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // Manual sync button — push local data then pull cloud data
  const handleManualSync = async () => {
    setSyncing(true)
    try {
      await pushAllToCloud()
      const result = await syncFromCloud()
      if (result === "pulled") window.location.reload()
      // Show brief success feedback
      setSyncMsg("Синхронизировано!")
      setTimeout(() => setSyncMsg(""), 2000)
    } catch (err) {
      console.error("[sync] Manual sync failed:", err)
      setSyncMsg("Ошибка синхронизации")
      setTimeout(() => setSyncMsg(""), 3000)
    }
    setSyncing(false)
  }

  // If logged in — show cloud status + logout
  if (user) {
    return (
      <div className="flex items-center gap-2">
        {/* Sync feedback message */}
        {syncMsg && (
          <span className={`text-xs font-medium ${syncMsg.includes("Ошибка") ? "text-destructive" : "text-primary"}`}>
            {syncMsg}
          </span>
        )}
        <button
          onClick={handleManualSync}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
          title="Синхронизировать"
        >
          {syncing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Cloud size={14} />
          )}
          <span className="hidden sm:inline">Синхр.</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title={user.email}
        >
          <LogOut size={14} />
          <span className="hidden sm:inline truncate max-w-[100px]">{user.email}</span>
        </button>
      </div>
    )
  }

  // Not logged in — show login button or form
  return (
    <div className="relative">
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <CloudOff size={14} />
        <span className="hidden sm:inline">Войти</span>
      </button>

      {showForm && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 glass-strong rounded-xl p-4 shadow-xl">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {isSignUp ? "Регистрация" : "Вход"}
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="password"
              placeholder="Пароль (мин. 6 символов)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 rounded-lg text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {error && <p className="text-xs text-destructive">{error}</p>}
            {message && <p className="text-xs text-primary">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isSignUp ? "Создать аккаунт" : "Войти"}
            </button>

            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage("") }}
              className="text-xs text-muted-foreground hover:text-foreground text-center"
            >
              {isSignUp ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Создать"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
