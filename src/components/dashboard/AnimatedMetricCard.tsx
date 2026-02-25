'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

interface AnimatedMetricCardProps {
  title: string
  value: number
  subtitle?: string
  className?: string
  large?: boolean
}

export function AnimatedMetricCard({
  title,
  value,
  subtitle,
  className,
  large = false,
}: AnimatedMetricCardProps) {
  const [displayed, setDisplayed] = useState(0)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const prevValueRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    const from = mountedRef.current ? (prevValueRef.current ?? 0) : 0
    const to = value
    const isFirstMount = !mountedRef.current
    mountedRef.current = true

    // Flash colour on value change after initial mount
    if (!isFirstMount && prevValueRef.current !== null && to !== prevValueRef.current) {
      setFlash(to > prevValueRef.current ? 'up' : 'down')
      const t = setTimeout(() => setFlash(null), 600)
      return () => clearTimeout(t)
    }
    prevValueRef.current = value

    const duration = isFirstMount ? 1400 : 900
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startRef.current = null

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      setDisplayed(from + (to - from) * easeOutExpo(progress))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        prevValueRef.current = value
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value])

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-shadow duration-300',
        flash === 'up' && 'shadow-[0_0_20px_rgba(52,211,153,0.25)]',
        flash === 'down' && 'shadow-[0_0_20px_rgba(248,113,113,0.2)]',
        className,
      )}
    >
      {/* flash overlay */}
      <div
        className={cn(
          'absolute inset-0 pointer-events-none transition-opacity duration-500',
          flash === 'up' ? 'bg-emerald-400/5 opacity-100' : 'opacity-0',
          flash === 'down' ? 'bg-red-400/5 opacity-100' : '',
        )}
      />
      <CardContent className="p-5 relative">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">{title}</p>
        <div
          className={cn(
            'font-bold tracking-tight tabular-nums transition-colors duration-300',
            large ? 'text-4xl' : 'text-2xl',
            flash === 'up' ? 'text-emerald-300' : flash === 'down' ? 'text-red-300' : 'text-white',
          )}
        >
          {formatCurrency(displayed)}
        </div>
        {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
