"use client"

import { useState, useMemo } from "react"
import {
  Plus,
  X,
  Check,
  GraduationCap,
  BookOpen,
  Clock,
  Timer,
  ChevronDown,
  ChevronRight,
  Snowflake,
  Play,
  CheckCircle2,
  Trash2,
  CalendarClock,
  TrendingUp,
  Target,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLearningStore } from "@/hooks/use-learning-store"
import { ReadingTab } from "@/components/reading-tab"
import type { SkillComplexity, SkillPriority, Skill } from "@/lib/types"
import {
  SKILL_STATUS_LABELS,
  SKILL_COMPLEXITY_LABELS,
  SKILL_PRIORITY_LABELS,
} from "@/lib/types"

function formatHours(h: number): string {
  return h.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 1 })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU")
}

function getStatusColor(status: string) {
  switch (status) {
    case "active": return "text-primary"
    case "completed": return "text-green-400"
    case "frozen": return "text-blue-300"
    default: return "text-muted-foreground"
  }
}

function getStatusBg(status: string) {
  switch (status) {
    case "active": return "bg-primary/10 border-primary/20"
    case "completed": return "bg-green-400/10 border-green-400/20"
    case "frozen": return "bg-blue-300/10 border-blue-300/20"
    default: return "bg-secondary/40 border-border/20"
  }
}

function getComplexityColor(c: SkillComplexity) {
  switch (c) {
    case "beginner": return "bg-green-400/10 text-green-400 border-green-400/20"
    case "intermediate": return "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
    case "advanced": return "bg-red-400/10 text-red-400 border-red-400/20"
  }
}

function getPriorityColor(p: SkillPriority) {
  switch (p) {
    case "high": return "bg-red-500/10 text-red-400 border-red-500/20"
    case "medium": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    case "low": return "bg-muted text-muted-foreground border-border/30"
  }
}

// ── Stats Cards ──

function LearningStats({
  activeCount,
  completedCount,
  totalHours,
  avgMinutesPerDay,
}: {
  activeCount: number
  completedCount: number
  totalHours: number
  avgMinutesPerDay: number
}) {
  return (
    <div className="glass-strong rounded-2xl p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Обзор обучения</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-3 text-center">
          <span className="text-[10px] text-muted-foreground block mb-1">Активных</span>
          <span className="text-lg font-bold text-foreground font-mono">{activeCount}</span>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <span className="text-[10px] text-muted-foreground block mb-1">Изучено</span>
          <span className="text-lg font-bold text-primary font-mono">{completedCount}</span>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <span className="text-[10px] text-muted-foreground block mb-1">Часов всего</span>
          <span className="text-lg font-bold text-foreground font-mono">{formatHours(totalHours)}</span>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <span className="text-[10px] text-muted-foreground block mb-1">Средняя сессия</span>
          <span className="text-lg font-bold text-foreground font-mono">{avgMinutesPerDay}</span>
          <span className="text-[10px] text-muted-foreground"> мин/день</span>
        </div>
      </div>
    </div>
  )
}

// ── Add Session Quick Form ──

function AddSessionForm({
  skills,
  onAdd,
}: {
  skills: Skill[]
  onAdd: (skillId: string, minutes: number, notes: string) => void
}) {
  const [skillId, setSkillId] = useState("")
  const [minutes, setMinutes] = useState("")
  const [notes, setNotes] = useState("")

  const activeSkills = skills.filter((s) => s.status === "active")

  function handleAdd() {
    if (!skillId || Number(minutes) <= 0) return
    onAdd(skillId, Number(minutes), notes)
    setMinutes("")
    setNotes("")
  }

  return (
    <div className="glass-strong rounded-2xl p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Timer className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Добавить сессию обучения</h3>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={skillId}
          onChange={(e) => setSkillId(e.target.value)}
          className="h-9 rounded-md bg-secondary/50 border border-border/50 text-foreground text-sm px-2 focus:outline-none focus:ring-1 focus:ring-ring min-w-[150px]"
        >
          <option value="">Выберите навык...</option>
          {activeSkills.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <Input
          type="number"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
          placeholder="Минуты..."
          className="bg-secondary/50 border-border/50 text-foreground text-sm h-9 w-24 font-mono"
        />
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
          placeholder="Заметки..."
          className="bg-secondary/50 border-border/50 text-foreground text-sm h-9 flex-1 min-w-[120px]"
        />
        <Button
          onClick={handleAdd}
          disabled={!skillId || !minutes || Number(minutes) <= 0}
          size="sm"
          className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Записать
        </Button>
      </div>
    </div>
  )
}

// ── Skill Card ──

function SkillCard({
  skill,
  children,
  forecastDate: forecast,
  onAddSession,
  onSetStatus,
  onRemove,
  isExpanded,
  onToggleExpand,
  hasChildren,
}: {
  skill: Skill
  children?: React.ReactNode
  forecastDate: string | null
  onAddSession: () => void
  onSetStatus: (status: "active" | "completed" | "frozen") => void
  onRemove: () => void
  isExpanded: boolean
  onToggleExpand: () => void
  hasChildren: boolean
}) {
  const percent = skill.hoursGoal > 0
    ? Math.min(100, Math.round((skill.currentHours / skill.hoursGoal) * 100))
    : 0

  return (
    <div className={`glass-strong rounded-2xl overflow-hidden transition-all duration-300 ${skill.status === "completed" ? "neon-glow" : ""}`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Circular progress */}
          <div className="w-14 h-14 shrink-0 relative">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" stroke="hsl(var(--secondary))" strokeWidth="3.5" fill="none" />
              <circle
                cx="28" cy="28" r="22"
                stroke={skill.status === "completed" ? "hsl(120, 60%, 50%)" : "hsl(var(--primary))"}
                strokeWidth="3.5" fill="none" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 22}
                strokeDashoffset={2 * Math.PI * 22 - (percent / 100) * 2 * Math.PI * 22}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {skill.status === "completed" ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : skill.status === "frozen" ? (
                <Snowflake className="w-4 h-4 text-blue-300" />
              ) : (
                <span className="text-[10px] font-bold text-foreground font-mono">{percent}%</span>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {hasChildren && (
                <button onClick={onToggleExpand} className="p-0.5 text-muted-foreground hover:text-foreground">
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              )}
              <h4 className="text-base font-bold text-foreground truncate">{skill.name}</h4>
            </div>
            {skill.description && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{skill.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${getStatusBg(skill.status)} ${getStatusColor(skill.status)}`}>
                {SKILL_STATUS_LABELS[skill.status]}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${getComplexityColor(skill.complexity)}`}>
                {SKILL_COMPLEXITY_LABELS[skill.complexity]}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${getPriorityColor(skill.priority)}`}>
                {SKILL_PRIORITY_LABELS[skill.priority]}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-sm font-bold font-mono text-foreground">
                {formatHours(skill.currentHours)}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                / {formatHours(skill.hoursGoal)} ч
              </span>
            </div>
            {forecast && skill.status === "active" && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <CalendarClock className="w-3 h-3" />
                Прогноз: {formatDate(forecast)}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            {skill.status === "active" && (
              <Button variant="ghost" size="icon" onClick={onAddSession} className="h-7 w-7 text-primary hover:text-primary" title="Добавить сессию">
                <Play className="w-3 h-3" />
              </Button>
            )}
            {skill.status === "active" && (
              <Button variant="ghost" size="icon" onClick={() => onSetStatus("frozen")} className="h-7 w-7 text-blue-300 hover:text-blue-300" title="Заморозить">
                <Snowflake className="w-3 h-3" />
              </Button>
            )}
            {skill.status === "frozen" && (
              <Button variant="ghost" size="icon" onClick={() => onSetStatus("active")} className="h-7 w-7 text-primary hover:text-primary" title="Возобновить">
                <Play className="w-3 h-3" />
              </Button>
            )}
            {skill.status === "active" && (
              <Button variant="ghost" size="icon" onClick={() => onSetStatus("completed")} className="h-7 w-7 text-green-400 hover:text-green-400" title="Отметить как изученный">
                <Check className="w-3 h-3" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Удалить">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${percent}%`,
                background: skill.status === "completed" ? "hsl(120, 60%, 50%)" : "hsl(var(--primary))",
                boxShadow: percent > 30 ? "0 0 8px hsl(var(--primary) / 0.4)" : undefined,
              }}
            />
          </div>
        </div>
      </div>

      {/* Children */}
      {isExpanded && children && (
        <div className="px-5 pb-5 pl-10 flex flex-col gap-3 border-t border-border/10 pt-3">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Add Skill Form ──

function AddSkillForm({
  skills,
  onAdd,
}: {
  skills: Skill[]
  onAdd: (params: {
    name: string
    description: string
    complexity: SkillComplexity
    priority: SkillPriority
    hoursGoal: number
    startDate: string
    endDate: string
    parentId: string | null
    dependencies: string[]
  }) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [complexity, setComplexity] = useState<SkillComplexity>("beginner")
  const [priority, setPriority] = useState<SkillPriority>("medium")
  const [hoursGoal, setHoursGoal] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [parentId, setParentId] = useState<string>("")

  function handleSubmit() {
    if (!name.trim() || Number(hoursGoal) <= 0) return
    onAdd({
      name: name.trim(),
      description,
      complexity,
      priority,
      hoursGoal: Number(hoursGoal),
      startDate,
      endDate,
      parentId: parentId || null,
      dependencies: [],
    })
    setName("")
    setDescription("")
    setComplexity("beginner")
    setPriority("medium")
    setHoursGoal("")
    setStartDate("")
    setEndDate("")
    setParentId("")
    setExpanded(false)
  }

  if (!expanded) {
    return (
      <Button
        onClick={() => setExpanded(true)}
        variant="ghost"
        className="w-full h-12 border border-dashed border-border/40 rounded-2xl text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 gap-2 transition-all duration-300"
      >
        <Plus className="w-4 h-4" />
        Добавить навык
      </Button>
    )
  }

  return (
    <div className="glass-strong rounded-2xl p-5 animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-foreground">Новый навык</h4>
        <button onClick={() => setExpanded(false)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название (например: Python)"
          className="bg-secondary/50 border-border/50 text-foreground text-sm h-9"
          autoFocus
        />
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание..."
          className="bg-secondary/50 border-border/50 text-foreground text-sm h-9"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Цель (часов)</label>
            <Input
              type="number"
              value={hoursGoal}
              onChange={(e) => setHoursGoal(e.target.value)}
              placeholder="100"
              className="bg-secondary/50 border-border/50 text-foreground text-sm h-9 font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Родительский навык</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full h-9 rounded-md bg-secondary/50 border border-border/50 text-foreground text-sm px-2 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Нет (корневой)</option>
              {skills.filter((s) => s.parentId === null).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Сложность</label>
            <select
              value={complexity}
              onChange={(e) => setComplexity(e.target.value as SkillComplexity)}
              className="w-full h-9 rounded-md bg-secondary/50 border border-border/50 text-foreground text-sm px-2 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="beginner">Начальный</option>
              <option value="intermediate">Средний</option>
              <option value="advanced">Продвинутый</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Приоритет</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as SkillPriority)}
              className="w-full h-9 rounded-md bg-secondary/50 border border-border/50 text-foreground text-sm px-2 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Дедлайн</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-secondary/50 border-border/50 text-foreground text-sm h-9"
            />
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || !hoursGoal || Number(hoursGoal) <= 0}
          className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Создать навык
        </Button>
      </div>
    </div>
  )
}

// ── Charts Section ──

function LearningCharts({
  hoursByDay,
  skillProgressData,
}: {
  hoursByDay: { label: string; hours: number }[]
  skillProgressData: { name: string; progress: number; status: string }[]
}) {
  return (
    <div className="glass-strong rounded-2xl p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Прогресс обучения</h3>
      </div>

      {/* Hours by day chart */}
      {hoursByDay.some((d) => d.hours > 0) && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3">Часы обучения по дням (30 дней)</h4>
          <div className="w-full h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoursByDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                  axisLine={{ stroke: "hsl(var(--border) / 0.3)" }}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [`${value} ч`, "Часы"]}
                />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Skill progress */}
      {skillProgressData.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-3">Прогресс по навыкам</h4>
          <div className="flex flex-col gap-2.5">
            {skillProgressData.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground">{s.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">{s.progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${s.progress}%`,
                      background: s.status === "completed" ? "hsl(120, 60%, 50%)" : "hsl(var(--primary))",
                      boxShadow: s.progress > 30 ? "0 0 6px hsl(var(--primary) / 0.3)" : undefined,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hoursByDay.some((d) => d.hours > 0) && skillProgressData.length === 0 && (
        <div className="text-xs text-muted-foreground text-center py-4">
          Добавьте навыки и записывайте сессии, чтобы увидеть прогресс
        </div>
      )}
    </div>
  )
}

// ── Main Learning Tab ──

export function LearningTab() {
  const store = useLearningStore()
  const [subTab, setSubTab] = useState<"skills" | "books">("skills")
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set())
  const [quickSessionSkillId, setQuickSessionSkillId] = useState<string | null>(null)
  const [quickMinutes, setQuickMinutes] = useState("")

  function toggleExpand(id: string) {
    setExpandedSkills((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleQuickSession(skillId: string) {
    if (quickSessionSkillId === skillId) {
      setQuickSessionSkillId(null)
      return
    }
    setQuickSessionSkillId(skillId)
    setQuickMinutes("")
  }

  function submitQuickSession() {
    if (!quickSessionSkillId || Number(quickMinutes) <= 0) return
    store.addSession(quickSessionSkillId, Number(quickMinutes), "")
    setQuickSessionSkillId(null)
    setQuickMinutes("")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Под-вкладки */}
      <div className="glass rounded-xl p-1 flex items-center gap-1 w-fit">
        <button
          onClick={() => setSubTab("skills")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            subTab === "skills"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Навыки
        </button>
        <button
          onClick={() => setSubTab("books")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            subTab === "books"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Книги
        </button>
      </div>

      {subTab === "books" ? (
        <ReadingTab />
      ) : (
      <>
      <LearningStats
        activeCount={store.activeCount}
        completedCount={store.completedCount}
        totalHours={store.totalHoursLearned}
        avgMinutesPerDay={store.avgStudyTimePerDay}
      />

      <AddSessionForm
        skills={store.skills}
        onAdd={store.addSession}
      />

      {/* Skill tree */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Навыки</h3>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {store.completedCount}/{store.skills.length} изучено
          </span>
        </div>

        {store.rootSkills.map((skill) => {
          const children = store.getChildSkills(skill.id)
          const hasChildren = children.length > 0
          const isExpanded = expandedSkills.has(skill.id)

          return (
            <div key={skill.id}>
              <SkillCard
                skill={skill}
                forecastDate={store.forecastDate(skill.id)}
                onAddSession={() => handleQuickSession(skill.id)}
                onSetStatus={(s) => store.setSkillStatus(skill.id, s)}
                onRemove={() => store.removeSkill(skill.id)}
                isExpanded={isExpanded}
                onToggleExpand={() => toggleExpand(skill.id)}
                hasChildren={hasChildren}
              >
                {children.map((child) => (
                  <div key={child.id} className="glass rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 relative">
                        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                          <circle cx="16" cy="16" r="12" stroke="hsl(var(--secondary))" strokeWidth="2" fill="none" />
                          <circle
                            cx="16" cy="16" r="12"
                            stroke="hsl(var(--primary))"
                            strokeWidth="2" fill="none" strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 12}
                            strokeDashoffset={2 * Math.PI * 12 - (Math.min(100, Math.round((child.currentHours / child.hoursGoal) * 100)) / 100) * 2 * Math.PI * 12}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[8px] font-bold font-mono text-foreground">
                            {Math.min(100, Math.round((child.currentHours / child.hoursGoal) * 100))}%
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-foreground">{child.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] px-1 py-0 rounded border ${getStatusBg(child.status)} ${getStatusColor(child.status)}`}>
                            {SKILL_STATUS_LABELS[child.status]}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {formatHours(child.currentHours)}/{formatHours(child.hoursGoal)}ч
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {child.status === "active" && (
                          <Button variant="ghost" size="icon" onClick={() => handleQuickSession(child.id)} className="h-6 w-6 text-primary">
                            <Play className="w-2.5 h-2.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => store.removeSkill(child.id)} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                          <X className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </SkillCard>

              {/* Quick session input */}
              {quickSessionSkillId === skill.id && (
                <div className="mt-2 flex items-center gap-2 px-4 animate-scale-in">
                  <Input
                    type="number"
                    value={quickMinutes}
                    onChange={(e) => setQuickMinutes(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") submitQuickSession() }}
                    placeholder="Минуты..."
                    className="bg-secondary/50 border-border/50 text-foreground text-sm h-8 w-24 font-mono"
                    autoFocus
                  />
                  <Button size="sm" onClick={submitQuickSession} disabled={Number(quickMinutes) <= 0} className="h-8 text-xs bg-primary text-primary-foreground">
                    <Check className="w-3 h-3 mr-1" />
                    Записать
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setQuickSessionSkillId(null)} className="h-8 text-xs text-muted-foreground">
                    Отмена
                  </Button>
                </div>
              )}

              {/* Quick session for children */}
              {children.map((child) =>
                quickSessionSkillId === child.id ? (
                  <div key={`qs-${child.id}`} className="mt-2 ml-10 flex items-center gap-2 animate-scale-in">
                    <Input
                      type="number"
                      value={quickMinutes}
                      onChange={(e) => setQuickMinutes(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") submitQuickSession() }}
                      placeholder="Минуты..."
                      className="bg-secondary/50 border-border/50 text-foreground text-sm h-8 w-24 font-mono"
                      autoFocus
                    />
                    <Button size="sm" onClick={submitQuickSession} disabled={Number(quickMinutes) <= 0} className="h-8 text-xs bg-primary text-primary-foreground">
                      <Check className="w-3 h-3 mr-1" />
                      Записать
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setQuickSessionSkillId(null)} className="h-8 text-xs text-muted-foreground">
                      Отмена
                    </Button>
                  </div>
                ) : null
              )}
            </div>
          )
        })}

        <AddSkillForm skills={store.skills} onAdd={store.addSkill} />
      </div>

      {/* Charts */}
      <LearningCharts
        hoursByDay={store.hoursByDay}
        skillProgressData={store.skillProgressData}
      />
      </>
      )}
    </div>
  )
}
