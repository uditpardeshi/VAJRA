import React, { useState, useMemo } from 'react'
import {
  BookOpen,
  User,
  Copy,
  Check,
  Cpu,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Bot,
} from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '@/types/api'
import { CitationCard } from './CitationCard'
import { FormattedMessage } from './FormattedMessage'
import { cn } from '@/utils/cn'

export interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [showThinking, setShowThinking] = useState(false)
  const isUser = message.role === 'user'

  const { thinkContent, mainContent } = useMemo(() => {
    if (isUser || !message.content) {
      return { thinkContent: null, mainContent: message.content }
    }

    const thinkMatch = message.content.match(/<think>([\s\S]*?)<\/think>/i)
    if (thinkMatch) {
      const think = thinkMatch[1].trim()
      const main = message.content.replace(/<think>[\s\S]*?<\/think>/i, '').trim()
      return { thinkContent: think, mainContent: main || think }
    }

    return { thinkContent: null, mainContent: message.content }
  }, [message.content, isUser])

  const handleCopy = () => {
    navigator.clipboard.writeText(mainContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const thinkWordCount = thinkContent ? thinkContent.split(/\s+/).length : 0

  return (
    <div className={cn('flex gap-2.5 sm:gap-3.5 max-w-[94%] sm:max-w-3xl w-full', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
      {/* Role Avatar */}
      <div
        className={cn(
          'w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-2xs mt-1',
          isUser
            ? 'bg-slate-900 ring-2 ring-slate-150'
            : 'bg-gradient-to-tr from-sky-400 via-primary to-blue-600 ring-2 ring-sky-100'
        )}
      >
        {isUser ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
      </div>

      <div className="space-y-1.5 max-w-full flex-1">
        {/* Role label & timestamp */}
        <div className={cn('flex items-center gap-2 text-[10px] sm:text-[11px]', isUser ? 'justify-end' : 'justify-start')}>
          <span className="font-bold text-slate-700">
            {isUser ? 'You' : 'VAJRA Technical Assistant'}
          </span>
          <span className="text-slate-400 font-mono">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Collapsible Model Reasoning Drawer */}
        {!isUser && thinkContent && (
          <div className="rounded-xl border border-sky-100/90 overflow-hidden bg-sky-50/30 shadow-2xs">
            <button
              type="button"
              onClick={() => setShowThinking(!showThinking)}
              className="w-full px-3 py-1.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 bg-sky-50/60 hover:bg-sky-100/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-semibold text-slate-800">Engineering Reasoning</span>
                <span className="px-1.5 py-0.2 bg-white/90 text-primary border border-sky-200/60 rounded-full text-[9px] font-mono font-bold">
                  {thinkWordCount} words
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-primary font-medium">
                <span>{showThinking ? 'Hide' : 'Trace'}</span>
                {showThinking ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </div>
            </button>

            {showThinking && (
              <div className="p-3 text-xs text-slate-700 bg-white/95 whitespace-pre-wrap leading-relaxed border-t border-sky-100 max-h-56 overflow-y-auto font-sans">
                {thinkContent}
              </div>
            )}
          </div>
        )}

        {/* Main Answer Bubble with Rich Markdown Formatting */}
        <div
          className={cn(
            'p-3.5 sm:p-4.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs relative group font-sans',
            isUser
              ? 'bg-gradient-to-r from-sky-600 via-primary to-blue-600 text-white rounded-tr-xs'
              : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{mainContent}</p>
          ) : (
            <FormattedMessage content={mainContent} />
          )}

          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-2xs"
              title="Copy answer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Citations & Schematics */}
        {message.citations && message.citations.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-primary" />
              Verified Document Citations ({message.citations.length})
            </p>
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
