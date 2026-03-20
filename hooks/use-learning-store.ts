"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import type { Skill, LearningSession, SkillStatus, SkillComplexity, SkillPriority } from "@/lib/types"
import { fetchLearningState, saveLearningState } from "@/lib/api-client"

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export function useLearningStore() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [sessions, setSessions] = useState<LearningSession[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load on mount
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const stored = await fetchLearningState()
        if (cancelled || !stored) return
        setSkills(stored.skills)
        setSessions(stored.sessions)
      } catch (error) {
        console.error("Failed to load learning state:", error)
      } finally {
        if (!cancelled) setIsLoaded(true)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  // Auto-save with debounce
  useEffect(() => {
    if (!isLoaded) return

    const timeout = window.setTimeout(() => {
      saveLearningState({ skills, sessions }).catch((error) => {
        console.error("Failed to save learning state:", error)
      })
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [isLoaded, skills, sessions])

  // === Mutations ===

  const addSkill = useCallback(
    (params: {
      name: string
      description: string
      complexity: SkillComplexity
      priority: SkillPriority
      hoursGoal: number
      startDate: string
      endDate: string
      parentId: string | null
      dependencies: string[]
    }) => {
      const skill: Skill = {
        id: generateId(),
        name: params.name.trim(),
        description: params.description.trim(),
        complexity: params.complexity,
        priority: params.priority,
        status: "active",
        hoursGoal: Math.max(1, params.hoursGoal),
        currentHours: 0,
        startDate: params.startDate || new Date().toISOString().split("T")[0],
        endDate: params.endDate || new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split("T")[0],
        parentId: params.parentId,
        dependencies: params.dependencies,
        createdAt: new Date().toISOString(),
      }
      setSkills((prev) => [...prev, skill])
    },
    []
  )

  const removeSkill = useCallback(
    (id: string) => {
      setSkills((prev) => prev.filter((s) => s.id !== id && s.parentId !== id))
      setSessions((prev) => prev.filter((s) => s.skillId !== id))
    },
    []
  )

  const updateSkill = useCallback(
    (id: string, updates: Partial<Skill>) => {
      setSkills((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      )
    },
    []
  )

  const setSkillStatus = useCallback(
    (id: string, status: SkillStatus) => {
      setSkills((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      )
    },
    []
  )

  const addSession = useCallback(
    (skillId: string, durationMinutes: number, notes: string) => {
      if (durationMinutes <= 0) return

      const session: LearningSession = {
        id: generateId(),
        skillId,
        date: new Date().toISOString().split("T")[0],
        durationMinutes,
        notes: notes.trim(),
      }

      setSessions((prev) => [...prev, session])

      // Update skill hours
      setSkills((prev) =>
        prev.map((s) => {
          if (s.id !== skillId) return s
          const newHours = s.currentHours + durationMinutes / 60
          const completed = newHours >= s.hoursGoal
          return {
            ...s,
            currentHours: Math.round(newHours * 100) / 100,
            status: completed && s.status === "active" ? "completed" : s.status,
          }
        })
      )
    },
    []
  )

  const removeSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => {
        const session = prev.find((s) => s.id === sessionId)
        if (!session) return prev

        // Recalc skill hours
        setSkills((skills) =>
          skills.map((sk) => {
            if (sk.id !== session.skillId) return sk
            const remaining = prev
              .filter((s) => s.skillId === session.skillId && s.id !== sessionId)
              .reduce((sum, s) => sum + s.durationMinutes, 0) / 60
            return { ...sk, currentHours: Math.round(remaining * 100) / 100 }
          })
        )

        return prev.filter((s) => s.id !== sessionId)
      })
    },
    []
  )

  // === Computed ===

  const rootSkills = useMemo(
    () => skills.filter((s) => s.parentId === null),
    [skills]
  )

  const getChildSkills = useCallback(
    (parentId: string) => skills.filter((s) => s.parentId === parentId),
    [skills]
  )

  const activeCount = useMemo(
    () => skills.filter((s) => s.status === "active").length,
    [skills]
  )

  const completedCount = useMemo(
    () => skills.filter((s) => s.status === "completed").length,
    [skills]
  )

  const frozenCount = useMemo(
    () => skills.filter((s) => s.status === "frozen").length,
    [skills]
  )

  const totalHoursLearned = useMemo(
    () => Math.round(sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60 * 10) / 10,
    [sessions]
  )

  const avgStudyTimePerDay = useMemo(() => {
    if (sessions.length === 0) return 0
    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
    const recent = sessions.filter((s) => new Date(s.date).getTime() >= thirtyDaysAgo)
    if (recent.length === 0) return 0
    const totalMinutes = recent.reduce((sum, s) => sum + s.durationMinutes, 0)
    // Count unique days
    const uniqueDays = new Set(recent.map((s) => s.date)).size
    return Math.round(totalMinutes / uniqueDays)
  }, [sessions])

  // Hours by day for chart (last 30 days)
  const hoursByDay = useMemo(() => {
    const now = new Date()
    const result: { date: string; label: string; hours: number }[] = []

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split("T")[0]
      const label = `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`
      const dayMinutes = sessions
        .filter((s) => s.date === dateStr)
        .reduce((sum, s) => sum + s.durationMinutes, 0)
      result.push({ date: dateStr, label, hours: Math.round(dayMinutes / 60 * 10) / 10 })
    }

    return result
  }, [sessions])

  // Skill progress data for chart
  const skillProgressData = useMemo(
    () =>
      skills
        .filter((s) => s.status !== "frozen")
        .map((s) => ({
          name: s.name,
          progress: s.hoursGoal > 0 ? Math.min(100, Math.round((s.currentHours / s.hoursGoal) * 100)) : 0,
          hoursLeft: Math.max(0, Math.round((s.hoursGoal - s.currentHours) * 10) / 10),
          status: s.status,
        })),
    [skills]
  )

  // Forecast: estimated date to complete a skill
  const forecastDate = useCallback(
    (skillId: string): string | null => {
      const skill = skills.find((s) => s.id === skillId)
      if (!skill || skill.status !== "active" || skill.currentHours >= skill.hoursGoal) return null

      // Average hours per day over last 30 days for this skill
      const now = Date.now()
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
      const recentSessions = sessions.filter(
        (s) => s.skillId === skillId && new Date(s.date).getTime() >= thirtyDaysAgo
      )

      if (recentSessions.length === 0) return null

      const totalMinutes = recentSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
      const avgHoursPerDay = totalMinutes / 60 / 30
      if (avgHoursPerDay <= 0) return null

      const hoursLeft = skill.hoursGoal - skill.currentHours
      const daysNeeded = Math.ceil(hoursLeft / avgHoursPerDay)

      const forecastD = new Date()
      forecastD.setDate(forecastD.getDate() + daysNeeded)
      return forecastD.toISOString().split("T")[0]
    },
    [skills, sessions]
  )

  return {
    skills,
    sessions,
    rootSkills,
    getChildSkills,
    addSkill,
    removeSkill,
    updateSkill,
    setSkillStatus,
    addSession,
    removeSession,
    activeCount,
    completedCount,
    frozenCount,
    totalHoursLearned,
    avgStudyTimePerDay,
    hoursByDay,
    skillProgressData,
    forecastDate,
  }
}
