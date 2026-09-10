import React from 'react'
import { cn } from '@/utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading, 
    loading, 
    icon, 
    iconPosition = 'left', 
    fullWidth,
    children, 
    disabled, 
    ...props 
  }, ref) => {
    const isSpinning = isLoading || loading
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0e17] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'
    
    const variants = {
      primary: 'bg-[#77BA99] text-[#1d1e25] font-bold hover:bg-[#88caa9] focus:ring-[#77BA99] shadow-md shadow-[#77BA99]/20',
      secondary: 'bg-[#262730] text-[#EFF0D1] hover:bg-[#32333e] border border-[#3d3e4b] focus:ring-[#77BA99]',
      accent: 'bg-[#D33F49] text-white hover:bg-[#bd333d] focus:ring-[#D33F49] shadow-md shadow-[#D33F49]/20',
      outline: 'border border-[#3d3e4b] bg-[#1d1e25] text-[#EFF0D1] hover:bg-[#262730] hover:text-white focus:ring-[#77BA99]',
      ghost: 'text-[#D7C0D0] hover:bg-[#262730] hover:text-[#EFF0D1] focus:ring-[#77BA99]',
      danger: 'bg-[#D33F49] text-white hover:bg-[#bd333d] focus:ring-[#D33F49] shadow-md shadow-[#D33F49]/20',
      success: 'bg-[#77BA99] text-[#1d1e25] font-bold hover:bg-[#88caa9] focus:ring-[#77BA99] shadow-md shadow-[#77BA99]/20',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3.5 text-base gap-2.5 font-semibold',
      icon: 'p-2.5',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isSpinning}
        className={cn(baseStyles, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        {...props}
      >
        {isSpinning ? (
          <>
            <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
          </>
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'
