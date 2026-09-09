import React from 'react'
import { Bot, User, Copy, Check } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '@/types/api'
import { CitationCard } from './CitationCard'
import { cn } from '@/utils/cn'

export interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false)
  const isUser = message.role === 'user'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('flex gap-3 max-w-3xl', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-xs',
          isUser ? 'bg-slate-700' : 'bg-primary'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={cn('space-y-2 max-w-full')}>
        <div
          className={cn(
            'p-4 rounded-2xl text-sm leading-relaxed shadow-xs relative group',
            isUser ? 'bg-primary text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
          )}
        >
          {message.content}

          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {message.citations && message.citations.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Citations &amp; Manual Sources</p>
            <div className="space-y-1.5">
              {message.citations.map((c, i) => (
                <CitationCard key={i} citation={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
