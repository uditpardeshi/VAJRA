import React from 'react'
import { cn } from '@/utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'accent' | 'neutral'
  size?: 'sm' | 'md'
}

export function Badge({ className, variant = 'primary', size = 'sm', children, ...props }: BadgeProps) {
  const variants = {
    primary: 'bg-[#77BA99]/15 text-[#77BA99] border-[#77BA99]/30',
    success: 'bg-[#77BA99]/15 text-[#77BA99] border-[#77BA99]/30',
    warning: 'bg-[#D7C0D0]/15 text-[#D7C0D0] border-[#D7C0D0]/30',
    accent: 'bg-[#D33F49]/15 text-[#D33F49] border-[#D33F49]/30',
    neutral: 'bg-[#1d1e25] text-[#D7C0D0] border-[#3d3e4b]',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
  }

  return (
    <span
      className={cn('inline-flex items-center border rounded-full font-sans tracking-tight', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  )
}
