"use client"

import { useState, useMemo } from "react"
import {
  Plus,
  X,
  Check,
  Pencil,
  Wallet,
  Shield,
  TrendingUp,
  TrendingDown,
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Minus,
  Landmark,
  BarChart3,
  Clock,
  ArrowUpRight,
  Percent,
  Calendar,
  Rocket,
  Briefcase,
  History,
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
import { useBudgetStore } from "@/hooks/use-budget-store"
import type {
  BudgetGoal,
  BudgetGoalCategory,
  ImportanceLevel,
  DistributionResult,
  Deposit,
  SavingsGoal,
} from "@/lib/types"
import { BUDGET_CATEGORIES, IMPORTANCE_LABELS } from "@/lib/types"

// ── Helpers ──

function formatMoney(n: number): string {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function getImportanceColor(level: ImportanceLevel): string {
  switch (level) {
    case 4: return "text-primary neon-text"
    case 3: return "text-primary/80"
    case 2: return "text-foreground"
    case 1: return "text-muted-foreground"
  }
}

function getImportanceBg(level: ImportanceLevel): string {
  switch (level) {
    case 4: return "bg-primary/15 border-primary/30"
    case 3: return "bg-primary/10 border-primary/20"
    case 2: return "bg-secondary/60 border-border/30"
    case 1: return "bg-secondary/40 border-border/20"
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU")
}

// ── Balance Section ──

function BalanceSection({
  cardBalance,
  reserveTarget,
  reserveCurrent,
  onUpdate,
}: {
  cardBalance: number
  reserveTarget: number
  reserveCurrent: number
  onUpdate: (updates: { cardBalance?: number; reserveTarget?: number; reserveCurrent?: number }) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editCard, setEditCard] = useState(String(cardBalance))
  const [editTarget, setEditTarget] = useState(String(reserveTarget))
  const [editCurrent, setEditCurrent] = useState(String(reserveCurrent))

  function handleSave() {
    onUpdate({
      cardBalance: Math.max(0, Number(editCard) || 0),
      reserveTarget: Math.max(0, Number(editTarget) || 0),
      reserveCurrent: Math.max(0, Number(editCurrent) || 0),
    })
    setEditing(false)
  }

  function handleStartEdit() {
    setEditCard(String(cardBalance))
    setEditTarget(String(reserveTarget))
    setEditCurrent(String(reserveCurrent))
    setEditing(true)
  }

  const reservePercent =
    reserveTarget > 0
      ? Math.round((reserveCurrent / reserveTarget) * 100)
      : 0

  return (
    <div className="glass-strong rounded-2xl p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Баланс</h3>
        </div>
        {!editing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartEdit}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            Изменить
          </Button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Остаток на карте
            </label>
            <Input
              type="number"
              value={editCard}
              onChange={(e) => setEditCard(e.target.value)}
              className="bg-secondary/50 border-border/50 text-foreground text-sm h-9"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Резервная сумма (цель)
            </label>
            <Input
              type="number"
              value={editTarget}
              onChange={(e) => setEditTarget(e.target.value)}
              className="bg-secondary/50 border-border/50 text-foreground text-sm h-9"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Текущий резерв (осталось)
            </label>
            <Input
              type="number"
              value={editCurrent}
              onChange={(e) => setEditCurrent(e.target.value)}
              className="bg-secondary/50 border-border/50 text-foreground text-sm h-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              className="h-8 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Сохранить
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
              className="h-8 text-muted-foreground"
            >
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4">
            <span className="text-[11px] text-muted-foreground block mb-1">
              На карте
            </span>
            <span className="text-xl font-bold text-foreground font-mono">
              {formatMoney(cardBalance)}
            </span>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="w-3 h-3 text-primary" />
              <span className="text-[11px] text-muted-foreground">
                Резерв
              </span>
            </div>
            <span className="text-xl font-bold text-foreground font-mono">
              {formatMoney(reserveCurrent)}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              / {formatMoney(reserveTarget)}
            </span>
          </div>
          <div className="glass rounded-xl p-4">
            <span className="text-[11px] text-muted-foreground block mb-1">
              Доступно для целей
            </span>
            <span className="text-xl font-bold text-primary font-mono neon-text">
              {formatMoney(Math.max(0, cardBalance - reserveCurrent))}
            </span>
          </div>
        </div>
      )}

      {!editing && reserveTarget > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">
              Резерв: {reservePercent}%
            </span>
            {reservePercent < 100 && (
              <span className="text-[10px] text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Не полный
              </span>
            )}
          </div>
          <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(100, reservePercent)}%`,
                background:
                  reservePercent >= 100
                    ? "hsl(var(--primary))"
                    : reservePercent >= 50
                      ? "hsl(45, 80%, 50%)"
                      : "hsl(0, 72%, 51%)",
                boxShadow:
                  reservePercent >= 80
                    ? "0 0 8px hsl(var(--primary) / 0.4)"
                    : undefined,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Income Section ──

function IncomeSection({
  onAddIncome,
  lastDistribution,
  lastReserveTopUp,
  onClearDistribution,
}: {
  onAddIncome: (amount: number) => { results: DistributionResult[]; toReserve: number } | null
  lastDistribution: DistributionResult[] | null
  lastReserveTopUp: number
  onClearDistribution: () => void
}) {
  const [amount, setAmount] = useState("")
  const [showResult, setShowResult] = useState(false)

  function handleDistribute() {
    const num = Number(amount)
    if (num <= 0) return
    onAddIncome(num)
    setAmount("")
    setShowResult(true)
  }

  const hasResults = lastDistribution && (lastDistribution.length > 0 || lastReserveTopUp > 0)

  return (
    <div className="glass-strong rounded-2xl p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">
          Добавить доход
        </h3>
      </div>

      <div className="flex items-center gap-3">
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleDistribute()
          }}
          placeholder="Сумма зарплаты..."
          className="bg-secondary/50 border-border/50 text-foreground text-sm h-10 flex-1 font-mono"
        />
        <Button
          onClick={handleDistribute}
          disabled={!amount || Number(amount) <= 0}
          className="h-10 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
        >
          <ArrowRight className="w-4 h-4" />
          Распределить
        </Button>
      </div>

      {/* Distribution results */}
      {showResult && hasResults && (
        <div className="mt-4 p-4 glass rounded-xl animate-scale-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-primary">
              Результат распределения
            </span>
            <button
              onClick={() => {
                setShowResult(false)
                onClearDistribution()
              }}
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {lastReserveTopUp > 0 && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/40 border border-border/20">
                <span className="text-xs text-foreground flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-primary" />
                  Пополнение резерва
                </span>
                <span className="text-xs font-bold font-mono text-foreground">
                  +{formatMoney(lastReserveTopUp)}
                </span>
              </div>
            )}
            {lastDistribution!.map((r) => (
              <div
                key={r.goalId}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/5 border border-primary/10"
              >
                <span className="text-xs text-foreground">{r.goalName}</span>
                <span className="text-xs font-bold font-mono text-primary">
                  +{formatMoney(r.amount)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-border/30 mt-1">
              <span className="text-xs text-muted-foreground">Итого</span>
              <span className="text-sm font-bold font-mono text-primary neon-text">
                {formatMoney(
                  lastReserveTopUp + lastDistribution!.reduce((s, r) => s + r.amount, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {showResult && lastDistribution && lastDistribution.length === 0 && lastReserveTopUp === 0 && (
        <div className="mt-4 p-3 glass rounded-xl text-xs text-muted-foreground text-center animate-scale-in">
          Нет активных целей для распределения
        </div>
      )}
    </div>
  )
}

// ── Expense Section ──

function ExpenseSection({
  expenses,
  onAdd,
  onRemove,
}: {
  expenses: import("@/lib/types").ExpenseEntry[]
  onAdd: (amount: number, description: string) => void
  onRemove: (id: string) => void
}) {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [showAll, setShowAll] = useState(false)

  function handleAdd() {
    const num = Number(amount)
    if (num <= 0) return
    onAdd(num, description)
    setAmount("")
    setDescription("")
  }

  const sorted = useMemo(
    () => [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses]
  )
  const visible = showAll ? sorted : sorted.slice(0, 5)

  return (
    <div className="glass-strong rounded-2xl p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="w-5 h-5 text-destructive/80" />
        <h3 className="text-base font-semibold text-foreground">Расходы</h3>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd()
          }}
          placeholder="Сумма..."
          className="bg-secondary/50 border-border/50 text-foreground text-sm h-9 w-28 font-mono"
        />
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd()
          }}
          placeholder="Описание..."
          className="bg-secondary/50 border-border/50 text-foreground text-sm h-9 flex-1"
        />
        <Button
          onClick={handleAdd}
          disabled={!amount || Number(amount) <= 0}
          size="sm"
          className="h-9 bg-destructive/80 text-destructive-foreground hover:bg-destructive/70 gap-1"
        >
          <Minus className="w-3.5 h-3.5" />
          Добавить
        </Button>
      </div>

      {sorted.length > 0 && (
        <div className="flex flex-col gap-2">
          {visible.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg glass border border-border/10 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(e.date)}
                </span>
                <span className="text-xs text-foreground truncate">
                  {e.description}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold font-mono text-destructive/80">
                  -{formatMoney(e.amount)}
                </span>
                <button
                  onClick={() => onRemove(e.id)}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary text-muted-foreground hover:text-destructive transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          {sorted.length > 5 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground py-1 transition-colors"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Свернуть
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Показать все ({sorted.length})
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Deposits Section ──

function DepositsSection({
  deposits,
  totalDepositValue,
  onAdd,
  onRemove,
}: {
  deposits: Deposit[]
  totalDepositValue: number
  onAdd: (params: {
    name: string
    bankName: string
    amount: number
    interestRate: number
    monthlyContribution: number
    startDate: string
    endDate: string
  }) => void
  onRemove: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [name, setName] = useState("")
  const [bankName, setBankName] = useState("")
  const [amount, setAmount] = useState("")
  const [rate, setRate] = useState("")
  const [monthly, setMonthly] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  function handleAdd() {
    if (!name.trim() || Number(amount) <= 0) return
    onAdd({
      name: name.trim(),
      bankName: bankName.trim() || "Банк",
      amount: Number(amount),
      interestRate: Number(rate) || 0,
      monthlyContribution: Number(monthly) || 0,
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate || new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split("T")[0],
    })
    setName("")
    setBankName("")
    setAmount("")
    setRate("")
    setMonthly("")
    setStartDate("")
    setEndDate("")
    setExpanded(false)
  }

  function calcExpectedIncome(d: Deposit): number {
    const start = new Date(d.startDate).getTime()
    const end = new Date(d.endDate).getTime()
    const years = Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 365.25))
    const months = Math.max(0, Math.round(years * 12))
    const monthlyC = d.monthlyContribution || 0
    const totalContribs = monthlyC * months
    const baseIncome = d.amount * (d.interestRate / 100) * years
    const contribIncome = totalContribs * (d.interestRate / 100) * (years / 2)
    return Math.round(baseIncome + contribIncome)
  }

  return (
    <div className="glass-strong rounded-2xl p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Вклады</h3>
        </div>
        {deposits.length > 0 && (
          <span className="text-xs text-muted-foreground font-mono">
            Итого: {formatMoney(Math.round(totalDepositValue))}
          </span>
        )}
      </div>

      {/* Deposit cards */}
      {deposits.length > 0 && (
        <div className="flex flex-col gap-3 mb-4">
          {deposits.map((d) => {
            const income = calcExpectedIncome(d)
            const now = Date.now()
            const end = new Date(d.endDate).getTime()
            const start = new Date(d.startDate).getTime()
            const elapsed = Math.max(0, now - start)
            const total = Math.max(1, end - start)
            const progress = Math.min(100, Math.round((elapsed / total) * 100))

            return (
              <div key={d.id} className="glass rounded-xl p-4 group">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground">{d.name}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/60 border border-border/20 text-muted-foreground">
                        {d.bankName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-lg font-bold font-mono text-foreground">
                        {formatMoney(d.amount)}
                      </span>
                      <span className="text-xs text-primary flex items-center gap-0.5 font-medium">
                        <Percent className="w-3 h-3" />
                        {d.interestRate}% годовых
                      </span>
                      {(d.monthlyContribution || 0) > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5 font-medium">
                          <Plus className="w-3 h-3" />
                          {formatMoney(d.monthlyContribution)}/мес
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(d.id)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary text-muted-foreground hover:text-destructive transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(d.startDate)} — {formatDate(d.endDate)}
                  </span>
                  <span className="flex items-center gap-1 text-primary">
                    <ArrowUpRight className="w-3 h-3" />
                    +{formatMoney(income)} доход
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  {progress}% срока прошло
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Add deposit form */}
      {expanded ? (
        <div className="glass rounded-xl p-4 animate-scale-in">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground">Новый вклад</h4>
            <button
              onClick={() => setExpanded(false)}
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название вклада"
                className="bg-secondary/50 border-border/50 text-foreground text-sm h-9"
                autoFocus
              />
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Банк"
                className="bg-secondary/50 border-border/50 text-foreground text-sm h-9"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Сумма</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100000"
                  className="bg-secondary/50 border-border/50 text-foreground text-sm h-9 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Ставка (% годовых)</label>
                <Input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="12"
                  className="bg-secondary/50 border-border/50 text-foreground text-sm h-9 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Ежемесячный взнос</label>
                <Input
                  type="number"
                  value={monthly}
                  onChange={(e) => setMonthly(e.target.value)}
                  placeholder="5000"
                  className="bg-secondary/50 border-border/50 text-foreground text-sm h-9 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Дата открытия</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-secondary/50 border-border/50 text-foreground text-sm h-9"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Дата закрытия</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-secondary/50 border-border/50 text-foreground text-sm h-9"
                />
              </div>
            </div>
            <Button
              onClick={handleAdd}
              disabled={!name.trim() || !amount || Number(amount) <= 0}
              className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Создать вклад
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setExpanded(true)}
          variant="ghost"
          className="w-full h-10 border border-dashed border-border/40 rounded-xl text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 gap-2 transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          Добавить вклад
        </Button>
      )}
    </div>
  )
}

// ── Analytics Section ──

function AnalyticsSection({
  avgMonthlyIncome,
  avgMonthlyExpenses,
  incomeChartData,
  incomeHistory,
  onRemoveIncome,
}: {
  avgMonthlyIncome: number
  avgMonthlyExpenses: number
  incomeChartData: { label: string; income: number; expense: number }[]
  incomeHistory: import("@/lib/types").IncomeEntry[]
  onRemoveIncome: (id: string) => void
}) {
  const [showHistory, setShowHistory] = useState(false)
  const netAvg = avgMonthlyIncome - avgMonthlyExpenses

  return (
    <div className="glass-strong rounded-2xl p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Аналитика</h3>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span className="text-[11px] text-muted-foreground">Средний доход/мес</span>
          </div>
          <span className="text-lg font-bold text-foreground font-mono">
            {formatMoney(avgMonthlyIncome)}
          </span>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3 h-3 text-destructive/70" />
            <span className="text-[11px] text-muted-foreground">Средние расходы/мес</span>
          </div>
          <span className="text-lg font-bold text-foreground font-mono">
            {formatMoney(avgMonthlyExpenses)}
          </span>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[11px] text-muted-foreground">Чистый баланс/мес</span>
          </div>
          <span className={`text-lg font-bold font-mono ${netAvg >= 0 ? "text-primary" : "text-destructive"}`}>
            {netAvg >= 0 ? "+" : ""}{formatMoney(netAvg)}
          </span>
        </div>
      </div>

      {/* Income history */}
      {incomeHistory.length > 0 && (
        <div className="mb-5">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2 hover:text-foreground transition-colors"
          >
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            История доходов ({incomeHistory.length})
          </button>
          {showHistory && (
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {[...incomeHistory].reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/30 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold font-mono text-foreground">
                      +{formatMoney(entry.amount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveIncome(entry.id)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary text-muted-foreground hover:text-destructive transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {incomeChartData.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-3">
            Доходы и расходы по месяцам
          </h4>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={incomeChartData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  axisLine={{ stroke: "hsl(var(--border) / 0.3)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number, name: string) => [
                    formatMoney(value),
                    name === "income" ? "Доход" : "Расходы",
                  ]}
                  labelFormatter={(label) => label}
                />
                <Bar
                  dataKey="income"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  opacity={0.85}
                />
                <Bar
                  dataKey="expense"
                  fill="hsl(0, 72%, 51%)"
                  radius={[4, 4, 0, 0]}
                  opacity={0.6}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary/85" />
              <span className="text-[10px] text-muted-foreground">Доходы</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(0, 72%, 51%, 0.6)" }} />
              <span className="text-[10px] text-muted-foreground">Расходы</span>
            </div>
          </div>
        </div>
      )}

      {incomeChartData.length === 0 && (
        <div className="text-xs text-muted-foreground text-center py-4">
          Добавьте доходы и расходы, чтобы увидеть график
        </div>
      )}
    </div>
  )
}

// ── Goal Card ──

function BudgetGoalCard({
  goal,
  effectiveImportance,
  onRemove,
  onUpdate,
}: {
  goal: BudgetGoal
  effectiveImportance: ImportanceLevel
  onRemove: () => void
  onUpdate: (updates: Partial<BudgetGoal>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(goal.name)
  const [editTarget, setEditTarget] = useState(String(goal.targetAmount))
  const [editDeadline, setEditDeadline] = useState(goal.deadline)
  const [editCategory, setEditCategory] = useState<BudgetGoalCategory>(goal.category)
  const [editImportance, setEditImportance] = useState<ImportanceLevel>(goal.importance)
  const [editCurrent, setEditCurrent] = useState(String(goal.currentAmount))

  const percent =
    goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
      : 0

  const isBoosted = effectiveImportance > goal.importance

  function handleSave() {
    onUpdate({
      name: editName.trim(),
      targetAmount: Math.max(1, Number(editTarget) || 1),
      currentAmount: Math.max(0, Number(editCurrent) || 0),
      deadline: editDeadline,
      category: editCategory,
      importance: editImportance,
    })
    setEditing(false)
  }

  function handleStartEdit() {
    setEditName(goal.name)
    setEditTarget(String(goal.targetAmount))
    setEditDeadline(goal.deadline)
    setEditCategory(goal.category)
    setEditImportance(goal.importance)
    setEditCurrent(String(goal.currentAmount))
    setEditing(true)
  }

  // Days left calculation
  const daysLeft = useMemo(() => {
    const now = Date.now()
    const deadline = new Date(goal.deadline).getTime()
    return Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)))
  }, [goal.deadline])

  return (
    <div
      className={`glass-strong rounded-2xl overflow-hidden transition-all duration-300 ${
        goal.completed ? "neon-glow" : ""
      }`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Circular progress */}
          <div className="w-16 h-16 shrink-0 relative">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="hsl(var(--secondary))"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke={goal.completed ? "hsl(var(--primary))" : percent >= 50 ? "hsl(var(--primary))" : "hsl(45, 80%, 50%)"}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={
                  2 * Math.PI * 26 - (percent / 100) * 2 * Math.PI * 26
                }
                className="transition-all duration-700 ease-out"
                style={{
                  filter:
                    percent > 0
                      ? `drop-shadow(0 0 4px rgba(var(--theme-glow), 0.3))`
                      : undefined,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {goal.completed ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <span className="text-[11px] font-bold text-foreground font-mono">
                  {percent}%
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex flex-col gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-secondary/50 border-border/50 text-foreground text-sm h-8"
                  placeholder="Название"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Цель</label>
                    <Input
                      type="number"
                      value={editTarget}
                      onChange={(e) => setEditTarget(e.target.value)}
                      className="bg-secondary/50 border-border/50 text-foreground text-sm h-8"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Накоплено</label>
                    <Input
                      type="number"
                      value={editCurrent}
                      onChange={(e) => setEditCurrent(e.target.value)}
                      className="bg-secondary/50 border-border/50 text-foreground text-sm h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Срок</label>
                    <Input
                      type="date"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      className="bg-secondary/50 border-border/50 text-foreground text-sm h-8"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Важность</label>
                    <select
                      value={editImportance}
                      onChange={(e) => setEditImportance(Number(e.target.value) as ImportanceLevel)}
                      className="w-full h-8 rounded-md bg-secondary/50 border border-border/50 text-foreground text-sm px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value={4}>4 — Критический</option>
                      <option value={3}>3 — Высокий</option>
                      <option value={2}>2 — Средний</option>
                      <option value={1}>1 — Низкий</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Категория</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as BudgetGoalCategory)}
                    className="w-full h-8 rounded-md bg-secondary/50 border border-border/50 text-foreground text-sm px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {BUDGET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Сохранить
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(false)}
                    className="h-7 text-xs text-muted-foreground"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {goal.completed ? (
                    <Sparkles className="w-4 h-4 text-primary animate-glow-pulse" />
                  ) : (
                    <Target className="w-4 h-4 text-muted-foreground" />
                  )}
                  <h4 className="text-base font-bold text-foreground truncate">
                    {goal.name}
                  </h4>
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-md border ${getImportanceBg(effectiveImportance)} ${getImportanceColor(effectiveImportance)} font-medium`}
                  >
                    {IMPORTANCE_LABELS[effectiveImportance]}
                    {isBoosted && (
                      <span className="ml-1 inline-flex items-center">
                        <ArrowUpRight className="w-2.5 h-2.5 inline" />
                      </span>
                    )}
                  </span>
                  {isBoosted && (
                    <span className="text-[10px] text-primary/70 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      Повышено (было: {IMPORTANCE_LABELS[goal.importance]})
                    </span>
                  )}
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary/40 border border-border/20 text-muted-foreground">
                    {goal.category}
                  </span>
                  <span className={`text-[11px] ${daysLeft <= 7 && !goal.completed ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    {goal.completed ? (
                      <>до {formatDate(goal.deadline)}</>
                    ) : daysLeft === 0 ? (
                      "Сегодня!"
                    ) : (
                      <>
                        {daysLeft <= 30 && <Clock className="w-2.5 h-2.5 inline mr-0.5" />}
                        {daysLeft} {daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"}
                      </>
                    )}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-lg font-bold font-mono text-foreground">
                    {formatMoney(goal.currentAmount)}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    / {formatMoney(goal.targetAmount)}
                  </span>
                </div>
              </>
            )}
          </div>

          {!editing && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStartEdit}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {!editing && (
          <div className="mt-3">
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${percent}%`,
                  background: goal.completed
                    ? "hsl(var(--primary))"
                    : percent >= 50
                      ? "hsl(var(--primary))"
                      : "hsl(45, 80%, 50%)",
                  boxShadow:
                    percent > 30
                      ? "0 0 8px hsl(var(--primary) / 0.4)"
                      : undefined,
                }}
              />
            </div>
            {goal.completed && (
              <div className="mt-2 flex items-center gap-1.5 text-primary text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Цель достигнута!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Add Goal Form ──

function AddGoalForm({
  onAdd,
}: {
  onAdd: (params: {
    name: string
    targetAmount: number
    deadline: string
    category: BudgetGoalCategory
    importance: ImportanceLevel
  }) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [name, setName] = useState("")
  const [target, setTarget] = useState("")
  const [deadline, setDeadline] = useState("")
  const [category, setCategory] = useState<BudgetGoalCategory>("Другое")
  const [importance, setImportance] = useState<ImportanceLevel>(2)

  function handleSubmit() {
    if (!name.trim() || !target || Number(target) <= 0) return
    onAdd({
      name: name.trim(),
      targetAmount: Number(target),
      deadline: deadline || new Date(new Date().getFullYear(), 11, 31).toISOString().split("T")[0],
      category,
      importance,
    })
    setName("")
    setTarget("")
    setDeadline("")
    setCategory("Другое")
    setImportance(2)
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
        Добавить цель
      </Button>
    )
  }

  return (
    <div className="glass-strong rounded-2xl p-5 animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-foreground">Новая цель</h4>
        <button
          onClick={() => setExpanded(false)}
          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название (например: Машина)"
          className="bg-secondary/50 border-border/50 text-foreground text-sm h-9"
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">
              Сумма цели
            </label>
            <Input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="350000"
              className="bg-secondary/50 border-border/50 text-foreground text-sm h-9 font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">
              Срок
            </label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-secondary/50 border-border/50 text-foreground text-sm h-9"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">
              Категория
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as BudgetGoalCategory)}
              className="w-full h-9 rounded-md bg-secondary/50 border border-border/50 text-foreground text-sm px-2 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {BUDGET_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">
              Важность
            </label>
            <select
              value={importance}
              onChange={(e) => setImportance(Number(e.target.value) as ImportanceLevel)}
              className="w-full h-9 rounded-md bg-secondary/50 border border-border/50 text-foreground text-sm px-2 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value={4}>4 — Критический</option>
              <option value={3}>3 — Высокий</option>
              <option value={2}>2 — Средний</option>
              <option value={1}>1 — Низкий</option>
            </select>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || !target || Number(target) <= 0}
          className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Создать цель
        </Button>
      </div>
    </div>
  )
}

// ── Summary Stats ──

function BudgetSummary({
  goals,
  totalIncome,
}: {
  goals: BudgetGoal[]
  totalIncome: number
}) {
  const activeGoals = goals.filter((g) => !g.completed)
  const completedGoals = goals.filter((g) => g.completed)
  const totalTarget = activeGoals.reduce((s, g) => s + g.targetAmount, 0)
  const totalSaved = activeGoals.reduce((s, g) => s + g.currentAmount, 0)
  const overallPercent =
    totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

  return (
    <div className="glass-strong rounded-2xl p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">
          Обзор целей
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-3 text-center">
          <span className="text-[10px] text-muted-foreground block mb-1">
            Активных
          </span>
          <span className="text-lg font-bold text-foreground font-mono">
            {activeGoals.length}
          </span>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <span className="text-[10px] text-muted-foreground block mb-1">
            Выполнено
          </span>
          <span className="text-lg font-bold text-primary font-mono">
            {completedGoals.length}
          </span>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <span className="text-[10px] text-muted-foreground block mb-1">
            Накоплено
          </span>
          <span className="text-lg font-bold text-foreground font-mono">
            {formatMoney(totalSaved)}
          </span>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <span className="text-[10px] text-muted-foreground block mb-1">
            Общий доход
          </span>
          <span className="text-lg font-bold text-foreground font-mono">
            {formatMoney(totalIncome)}
          </span>
        </div>
      </div>

      {activeGoals.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">
              Общий прогресс активных целей
            </span>
            <span className="text-xs font-bold font-mono text-foreground">
              {overallPercent}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{
                width: `${overallPercent}%`,
                boxShadow: "0 0 8px hsl(var(--primary) / 0.4)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Savings Goal Card (smart accumulation) ──

function SavingsGoalCard({
  goal,
  recommendation,
  onAddEarning,
  onRemoveEarning,
  onRemove,
}: {
  goal: SavingsGoal
  recommendation: {
    totalEarned: number
    remaining: number
    percent: number
    avgDailyIncome: number
    weeksLeft: number
    recommendedDaysPerWeek: number
    recentRecommendedDays: number
    pacePercent: number
    recentAvg: number
    daysWorked: number
  }
  onAddEarning: (amount: number) => void
  onRemoveEarning: (earningId: string) => void
  onRemove: () => void
}) {
  const [amount, setAmount] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const r = recommendation
  const completed = r.percent >= 100

  function handleAdd() {
    const num = Number(amount)
    if (num <= 0) return
    onAddEarning(num)
    setAmount("")
  }

  // Adaptive message based on pace
  const getMessage = () => {
    if (completed) return { text: "Цель достигнута!", color: "text-primary" }
    if (r.weeksLeft <= 0) return { text: "Дедлайн прошёл", color: "text-destructive" }
    if (r.pacePercent >= 5) return {
      text: `Можно расслабиться — опережаешь план на ${r.pacePercent}%`,
      color: "text-primary",
    }
    if (r.pacePercent <= -20) return {
      text: `Отстаёшь от плана на ${Math.abs(r.pacePercent)}% — нужно ускориться`,
      color: "text-destructive",
    }
    if (r.pacePercent < 0) return {
      text: `Немного отстаёшь (${Math.abs(r.pacePercent)}%) — держи темп`,
      color: "text-yellow-400",
    }
    return { text: "Идёшь по плану", color: "text-primary" }
  }

  const msg = getMessage()

  // Sorted earnings (newest first)
  const sortedEarnings = useMemo(
    () => [...goal.earnings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [goal.earnings]
  )

  return (
    <div className={`glass-strong rounded-2xl overflow-hidden transition-all duration-300 ${completed ? "neon-glow" : ""}`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">{goal.name}</h4>
              <span className="text-[10px] text-muted-foreground">
                до {formatDate(goal.deadline)} · {r.weeksLeft > 0 ? `${r.weeksLeft} нед. осталось` : "дедлайн прошёл"}
              </span>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">
              {formatMoney(r.totalEarned)} / {formatMoney(goal.targetAmount)}
            </span>
            <span className="text-xs font-bold font-mono text-foreground">{r.percent}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(100, r.percent)}%`,
                background: completed
                  ? "hsl(var(--primary))"
                  : r.percent >= 50
                    ? "hsl(var(--primary))"
                    : "hsl(45, 80%, 50%)",
                boxShadow: r.percent > 30 ? "0 0 8px hsl(var(--primary) / 0.4)" : undefined,
              }}
            />
          </div>
        </div>

        {/* Adaptive message */}
        <div className={`text-xs font-medium mb-4 ${msg.color}`}>
          {msg.text}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="glass rounded-lg p-2.5 text-center">
            <span className="text-[10px] text-muted-foreground block mb-0.5">Средний доход/день</span>
            <span className="text-sm font-bold font-mono text-foreground">{formatMoney(r.avgDailyIncome)}</span>
          </div>
          <div className="glass rounded-lg p-2.5 text-center">
            <span className="text-[10px] text-muted-foreground block mb-0.5">Дней отработано</span>
            <span className="text-sm font-bold font-mono text-foreground">{r.daysWorked}</span>
          </div>
          <div className="glass rounded-lg p-2.5 text-center">
            <span className="text-[10px] text-muted-foreground block mb-0.5">Нужно дней/нед</span>
            <span className={`text-sm font-bold font-mono ${r.recentRecommendedDays > goal.workDaysPerWeek ? "text-yellow-400" : "text-primary"}`}>
              {r.recentRecommendedDays}
            </span>
          </div>
          <div className="glass rounded-lg p-2.5 text-center">
            <span className="text-[10px] text-muted-foreground block mb-0.5">Осталось</span>
            <span className="text-sm font-bold font-mono text-foreground">{formatMoney(r.remaining)}</span>
          </div>
        </div>

        {/* Add earning input */}
        {!completed && (
          <div className="flex items-center gap-3 mb-3">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
              placeholder="Сколько заработал сегодня..."
              className="bg-secondary/50 border-border/50 text-foreground text-sm h-9 flex-1 font-mono"
            />
            <Button
              onClick={handleAdd}
              disabled={!amount || Number(amount) <= 0}
              size="sm"
              className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Внести
            </Button>
          </div>
        )}

        {/* Earnings history */}
        {goal.earnings.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <History className="w-3.5 h-3.5" />
              {showHistory ? "Скрыть" : "История"} ({goal.earnings.length})
              {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showHistory && (
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {sortedEarnings.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-secondary/30 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-primary">
                        +{formatMoney(e.amount)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(e.date)}
                      </span>
                    </div>
                    <button
                      onClick={() => onRemoveEarning(e.id)}
                      className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary text-muted-foreground hover:text-destructive transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {completed && (
          <div className="flex items-center gap-1.5 text-primary text-xs font-medium mt-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Цель достигнута!
          </div>
        )}
      </div>
    </div>
  )
}

// ── Add Savings Goal Form ──

function AddSavingsGoalForm({
  onAdd,
}: {
  onAdd: (params: { name: string; targetAmount: number; deadline: string; workDaysPerWeek: number }) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [name, setName] = useState("")
  const [target, setTarget] = useState("")
  const [deadline, setDeadline] = useState("")
  const [workDays, setWorkDays] = useState("2")

  function handleSubmit() {
    if (!name.trim() || !target || Number(target) <= 0) return
    onAdd({
      name: name.trim(),
      targetAmount: Number(target),
      deadline: deadline || new Date(new Date().getFullYear(), 7, 31).toISOString().split("T")[0],
      workDaysPerWeek: Math.max(1, Math.min(7, Number(workDays) || 2)),
    })
    setName("")
    setTarget("")
    setDeadline("")
    setWorkDays("2")
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
        Новая цель накопления
      </Button>
    )
  }

  return (
    <div className="glass-strong rounded-2xl p-5 animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-foreground">Новая цель накопления</h4>
        <button
          onClick={() => setExpanded(false)}
          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название (например: Накопить 350к к лету)"
          className="bg-secondary/50 border-border/50 text-foreground text-sm h-9"
          autoFocus
        />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Целевая сумма</label>
            <Input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="350000"
              className="bg-secondary/50 border-border/50 text-foreground text-sm h-9 font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Дедлайн</label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-secondary/50 border-border/50 text-foreground text-sm h-9"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Дней работы/нед</label>
            <Input
              type="number"
              value={workDays}
              onChange={(e) => setWorkDays(e.target.value)}
              min={1}
              max={7}
              className="bg-secondary/50 border-border/50 text-foreground text-sm h-9 font-mono"
            />
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || !target || Number(target) <= 0}
          className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
        >
          <Rocket className="w-4 h-4" />
          Создать цель
        </Button>
      </div>
    </div>
  )
}

// ── Main Budget Tab ──

export function BudgetTab() {
  const store = useBudgetStore()

  const totalIncome = useMemo(
    () => store.incomeHistory.reduce((s, e) => s + e.amount, 0),
    [store.incomeHistory]
  )

  // Build map of effective importance by goal ID
  const effectiveMap = useMemo(() => {
    const map = new Map<string, ImportanceLevel>()
    for (const eg of store.effectiveGoals) {
      map.set(eg.id, eg.importance)
    }
    return map
  }, [store.effectiveGoals])

  // Sort goals: active first (by effective importance desc), then completed
  const sortedGoals = useMemo(() => {
    const active = store.goals
      .filter((g) => !g.completed)
      .sort((a, b) => (effectiveMap.get(b.id) ?? b.importance) - (effectiveMap.get(a.id) ?? a.importance))
    const done = store.goals.filter((g) => g.completed)
    return [...active, ...done]
  }, [store.goals, effectiveMap])

  return (
    <div className="flex flex-col gap-6">
      <BalanceSection
        cardBalance={store.balance.cardBalance}
        reserveTarget={store.balance.reserveTarget}
        reserveCurrent={store.balance.reserveCurrent}
        onUpdate={store.updateBalance}
      />

      <IncomeSection
        onAddIncome={store.addIncome}
        lastDistribution={store.lastDistribution}
        lastReserveTopUp={store.lastReserveTopUp}
        onClearDistribution={store.clearLastDistribution}
      />

      <ExpenseSection
        expenses={store.expenses}
        onAdd={store.addExpense}
        onRemove={store.removeExpense}
      />

      {/* Analytics */}
      {(store.incomeHistory.length > 0 || store.expenses.length > 0) && (
        <AnalyticsSection
          avgMonthlyIncome={store.avgMonthlyIncome}
          avgMonthlyExpenses={store.avgMonthlyExpenses}
          incomeChartData={store.incomeChartData}
          incomeHistory={store.incomeHistory}
          onRemoveIncome={store.removeIncome}
        />
      )}

      {store.goals.length > 0 && (
        <BudgetSummary goals={store.goals} totalIncome={totalIncome} />
      )}

      {/* Goals list */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Цели накопления
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            {store.goals.filter((g) => g.completed).length}/{store.goals.length} выполнено
          </span>
        </div>

        {sortedGoals.map((goal) => (
          <BudgetGoalCard
            key={goal.id}
            goal={goal}
            effectiveImportance={effectiveMap.get(goal.id) ?? goal.importance}
            onRemove={() => store.removeGoal(goal.id)}
            onUpdate={(updates) => store.updateGoal(goal.id, updates)}
          />
        ))}

        <AddGoalForm onAdd={store.addGoal} />
      </div>

      {/* Smart Savings Goals */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Умные цели накопления</h3>
        </div>

        {store.savingsGoals.map((goal) => (
          <SavingsGoalCard
            key={goal.id}
            goal={goal}
            recommendation={store.getSavingsRecommendation(goal)}
            onAddEarning={(amount) => store.addEarning(goal.id, amount)}
            onRemoveEarning={(earningId) => store.removeEarning(goal.id, earningId)}
            onRemove={() => store.removeSavingsGoal(goal.id)}
          />
        ))}

        <AddSavingsGoalForm onAdd={store.addSavingsGoal} />
      </div>

      {/* Deposits */}
      <DepositsSection
        deposits={store.deposits}
        totalDepositValue={store.totalDepositValue}
        onAdd={store.addDeposit}
        onRemove={store.removeDeposit}
      />
    </div>
  )
}
