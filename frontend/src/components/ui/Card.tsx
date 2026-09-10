import React from 'react'
import { cn } from '@/utils/cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'outline'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-[#262730] border border-[#3d3e4b] shadow-lg rounded-xl text-[#EFF0D1]',
      glass: 'glass-panel rounded-xl text-[#EFF0D1]',
      elevated: 'bg-[#2e2f3a] shadow-xl rounded-xl border border-[#3d3e4b] text-[#EFF0D1]',
      outline: 'bg-transparent border border-[#3d3e4b] rounded-xl text-[#EFF0D1]',
    }

    return (
      <div ref={ref} className={cn('p-3.5 sm:p-4 transition-all', variants[variant], className)} {...props}>
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'
