import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, differenceInDays } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'AUD', compact = false): string {
  if (compact && Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`
  }
  if (compact && Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}k`
  }
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatRelativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function daysUntil(date: string | Date): number {
  return differenceInDays(new Date(date), new Date())
}

export function formatTokenAmount(amount: number, symbol: string): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M ${symbol}`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K ${symbol}`
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${symbol}`
}

// For assets with quantity, value = price per unit. Total = price * qty.
// For assets without quantity (cash, property), value = total directly.
export function getAssetValue(asset: { value: number | string; quantity?: number | string | null }): number {
  const price = Number(asset.value)
  const qty = asset.quantity ? Number(asset.quantity) : null
  return qty ? price * qty : price
}

export function getAssetPrice(asset: { value: number | string }): number {
  return Number(asset.value)
}

/**
 * Calculates how many tokens have vested as of now, based on the schedule.
 * The first vest event happens ON vest_start_date (mirrors AddAssetModal logic).
 */
export function calcVestedTokens(schedule: {
  vest_start_date: string
  vest_amount: number | string
  vest_frequency: string
  total_tokens: number | string
}): number {
  // Postgres returns "2025-09-16 00:00:00+00" which Node.js won't parse.
  // Slice to date-only "YYYY-MM-DD" which is unambiguously UTC midnight.
  const start = new Date((schedule.vest_start_date as string).slice(0, 10))
  const now = new Date()
  if (isNaN(start.getTime()) || start > now) return 0

  const vestAmount = Number(schedule.vest_amount)
  const totalTokens = Number(schedule.total_tokens)
  const msElapsed = now.getTime() - start.getTime()

  let periods: number
  switch (schedule.vest_frequency) {
    case 'second': periods = Math.floor(msElapsed / 1_000) + 1; break
    case 'minute': periods = Math.floor(msElapsed / 60_000) + 1; break
    case 'hour':   periods = Math.floor(msElapsed / 3_600_000) + 1; break
    case 'day':    periods = Math.floor(msElapsed / 86_400_000) + 1; break
    case 'week':   periods = Math.floor(msElapsed / (7 * 86_400_000)) + 1; break
    case 'month': {
      // Month lengths vary — count boundary crossings with the same loop used at creation
      let count = 0
      const d = new Date(start)
      while (d <= now) { count++; d.setMonth(d.getMonth() + 1) }
      periods = count
      break
    }
    default: periods = 0
  }

  return Math.min(periods * vestAmount, totalTokens)
}

export function getChangeColor(value: number): string {
  if (value > 0) return 'text-emerald-400'
  if (value < 0) return 'text-red-400'
  return 'text-zinc-400'
}

export function getChangeBg(value: number): string {
  if (value > 0) return 'bg-emerald-400/10 text-emerald-400'
  if (value < 0) return 'bg-red-400/10 text-red-400'
  return 'bg-zinc-400/10 text-zinc-400'
}

export function nextFriday(): Date {
  const today = new Date()
  const day = today.getDay()
  const daysUntilFriday = (5 - day + 7) % 7 || 7
  const next = new Date(today)
  next.setDate(today.getDate() + daysUntilFriday)
  return next
}

export function nextFortnightDate(lastDate: string): Date {
  const last = new Date(lastDate)
  const next = new Date(last)
  next.setDate(last.getDate() + 14)
  return next
}

export function next16thOfMonth(): Date {
  const today = new Date()
  const next = new Date(today.getFullYear(), today.getMonth(), 16)
  if (next <= today) {
    next.setMonth(next.getMonth() + 1)
  }
  return next
}
