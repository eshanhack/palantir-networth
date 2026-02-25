import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info'
}

const variants = {
  default: 'bg-zinc-800 text-zinc-300',
  success: 'bg-emerald-400/10 text-emerald-400',
  danger: 'bg-red-400/10 text-red-400',
  warning: 'bg-amber-400/10 text-amber-400',
  info: 'bg-blue-400/10 text-blue-400',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', variants[variant], className)}
      {...props}
    />
  )
}
