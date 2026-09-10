import React from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">{label}</label>}
        <div className="relative flex items-center">
          {icon && <div className="absolute left-3.5 text-slate-400 pointer-events-none">{icon}</div>}
          <input
            ref={ref}
            className={cn(
              'w-full px-3.5 py-2.5 bg-[#111927] border border-[#23334d] rounded-xl text-sm text-white placeholder:text-slate-400 focus:bg-[#152236] focus:border-sky-500/70 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all font-normal',
              icon && 'pl-10',
              error && 'border-rose-500 focus:ring-rose-500',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
