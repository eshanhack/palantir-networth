'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  TrendingUp,
  CreditCard,
  Receipt,
  Settings,
  RefreshCw,
  Coins,
} from 'lucide-react'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/assets', label: 'Assets', icon: Wallet },
  { href: '/liabilities', label: 'Liabilities', icon: CreditCard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/income', label: 'Income', icon: TrendingUp },
  { href: '/spending', label: 'Spending', icon: Receipt },
  { href: '/vesting', label: 'Vesting', icon: Coins },
  { href: '/bills', label: 'Bills', icon: RefreshCw },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="fixed inset-y-0 left-0 w-56 border-r border-zinc-800 bg-zinc-950 flex flex-col z-50">
      <div className="h-16 flex items-center px-5 border-b border-zinc-800">
        <span className="text-lg font-bold tracking-tight text-white">Net<span className="text-indigo-400">worth</span></span>
      </div>
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-indigo-600/20 text-indigo-300'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-zinc-800">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-zinc-500">Live prices</span>
        </div>
      </div>
    </aside>
  )
}
