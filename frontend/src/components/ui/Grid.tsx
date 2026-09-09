import React from 'react'
import { cn } from '@/utils/cn'

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: { base?: number; sm?: number; md?: number; lg?: number; xl?: number }
  gap?: number
}

export function Grid({ className, cols = { base: 1, lg: 2 }, gap = 4, children, ...props }: GridProps) {
  const colClasses = [
    cols.base && `grid-cols-${cols.base}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ')

  return (
    <div className={cn('grid', colClasses, `gap-${gap}`, className)} {...props}>
      {children}
    </div>
  )
}
