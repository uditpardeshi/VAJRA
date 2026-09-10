import React from 'react'
import { cn } from '@/utils/cn'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">{label}</label>}
        <select
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 bg-[#111927] border border-[#23334d] rounded-xl text-sm text-white focus:bg-[#152236] focus:border-sky-500/70 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all cursor-pointer font-normal',
            error && 'border-rose-500 focus:ring-rose-500',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#111927] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
