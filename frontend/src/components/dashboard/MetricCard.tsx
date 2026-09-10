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
    primary: 'bg-[#77BA99]/15 text-[#77BA99] border border-[#77BA99]/30',
    accent: 'bg-[#D33F49]/15 text-[#D33F49] border border-[#D33F49]/30',
    success: 'bg-[#77BA99]/20 text-[#77BA99] border border-[#77BA99]/40',
    warning: 'bg-[#D7C0D0]/20 text-[#D7C0D0] border border-[#D7C0D0]/40',
  }

  return (
    <Card className="space-y-1.5 p-3 sm:p-3.5 bg-[#262730] border border-[#3d3e4b] shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-[11px] font-bold text-[#D7C0D0] uppercase tracking-wider">{label}</span>
        <div className={cn('p-1.5 rounded-lg', iconBg[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between pt-0.5">
        <span className="text-xl sm:text-2xl font-black tracking-tight text-[#EFF0D1]">{value}</span>
        {trend && (
          <div className={cn('flex items-center gap-0.5 text-xs font-bold', trend.positive ? 'text-[#77BA99]' : 'text-[#D33F49]')}>
            {trend.positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
