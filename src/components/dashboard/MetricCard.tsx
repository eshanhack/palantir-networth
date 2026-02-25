import { Card, CardContent } from '@/components/ui/card'
import { cn, formatCurrency, formatPercent, getChangeBg } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number
  change?: number
  changePeriod?: string
  subtitle?: string
  isCurrency?: boolean
  isPercent?: boolean
  className?: string
  large?: boolean
  prefix?: string
  suffix?: string
}

export function MetricCard({
  title,
  value,
  change,
  changePeriod = '30d',
  subtitle,
  isCurrency = true,
  isPercent = false,
  className,
  large = false,
  prefix,
  suffix,
}: MetricCardProps) {
  const hasChange = change !== undefined
  const isPositive = (change ?? 0) > 0
  const isNegative = (change ?? 0) < 0

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-5">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">{title}</p>
        <div className={cn('font-bold tracking-tight text-white', large ? 'text-4xl' : 'text-2xl')}>
          {prefix && <span className="text-zinc-400">{prefix}</span>}
          {isCurrency
            ? formatCurrency(value)
            : isPercent
            ? `${value.toFixed(1)}%`
            : value.toLocaleString()}
          {suffix && <span className="text-zinc-400 text-base ml-1">{suffix}</span>}
        </div>
        {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
        {hasChange && (
          <div className={cn('inline-flex items-center gap-1 mt-3 px-2 py-0.5 rounded-md text-xs font-medium', getChangeBg(change!))}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : isNegative ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {formatPercent(change!)} vs {changePeriod}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
