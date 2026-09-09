import React from 'react'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

export interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: { value: number; positive: boolean }
  color?: 'primary' | 'accent' | 'success' | 'warning'
}

export function MetricCard({ icon: Icon, label, value, trend, color = 'primary' }: MetricCardProps) {
  const iconBg = {
    primary: 'bg-primary-50 text-primary',
    accent: 'bg-accent-50 text-accent',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
  }

  return (
    <Card variant="default" className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={cn('p-2 rounded-xl', iconBg[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</span>
        {trend && (
          <div className={cn('flex items-center gap-0.5 text-xs font-bold', trend.positive ? 'text-emerald-600' : 'text-rose-600')}>
            {trend.positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
