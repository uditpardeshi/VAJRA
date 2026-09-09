import React from 'react'
import { cn } from '@/utils/cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'outline'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-slate-200/80 shadow-card rounded-2xl',
      glass: 'glass-panel shadow-soft rounded-2xl',
      elevated: 'bg-white shadow-elevated rounded-2xl border border-slate-100',
      outline: 'bg-transparent border border-slate-200 rounded-2xl',
    }

    return (
      <div ref={ref} className={cn('p-5 transition-all', variants[variant], className)} {...props}>
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'
