import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0e17] text-center">
          <div className="p-4 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full mb-4">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-300 max-w-md mb-6">
            {this.state.error?.message || 'An unexpected runtime error occurred.'}
          </p>
          <Button onClick={() => window.location.reload()} variant="primary">
            <RefreshCw className="w-4 h-4 mr-2" /> Reload Application
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
