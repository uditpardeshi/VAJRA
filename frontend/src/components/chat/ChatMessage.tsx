import React, { useState, useMemo } from 'react'
import {
  BookOpen,
  User,
  Copy,
  Check,
  Cpu,
  ChevronDown,
  ChevronUp,
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
    <div className={cn('flex gap-2 sm:gap-3 max-w-[96%] sm:max-w-3xl w-full', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
      {/* Role Avatar */}
      <div
        className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs shadow-xs mt-0.5',
          isUser
            ? 'bg-[#262730] border border-[#3d3e4b] text-[#EFF0D1]'
            : 'bg-[#1d1e25] border border-[#3d3e4b] text-[#77BA99]'
        )}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
      </div>

      <div className="space-y-1 max-w-full flex-1">
        {/* Role label & timestamp */}
        <div className={cn('flex items-center gap-1.5 text-[10px] sm:text-[11px]', isUser ? 'justify-end' : 'justify-start')}>
          <span className="font-bold text-[#EFF0D1]">
            {isUser ? 'Operator' : 'VAJRA Diagnostic System'}
          </span>
          <span className="text-[#D7C0D0]/70 font-mono">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Collapsible Model Reasoning Drawer */}
        {!isUser && thinkContent && (
          <div className="rounded-lg border border-[#3d3e4b] overflow-hidden bg-[#1d1e25] shadow-xs">
            <button
              type="button"
              onClick={() => setShowThinking(!showThinking)}
              className="w-full px-2.5 py-1.5 flex items-center justify-between text-xs font-semibold text-[#EFF0D1] hover:text-white bg-[#262730] hover:bg-[#32333e] transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#77BA99]" />
                <span className="text-[11px] font-semibold text-[#EFF0D1]">Diagnostic Verification Trace</span>
                <span className="px-1.5 py-0.2 bg-[#1d1e25] text-[#77BA99] border border-[#77BA99]/30 rounded-md text-[9px] font-mono font-bold">
                  {thinkWordCount} words
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[#77BA99] font-medium">
                <span>{showThinking ? 'Hide' : 'Trace'}</span>
                {showThinking ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </div>
            </button>

            {showThinking && (
              <div className="p-2.5 text-xs text-[#D7C0D0] bg-[#191a22] whitespace-pre-wrap leading-relaxed border-t border-[#3d3e4b] max-h-56 overflow-y-auto font-sans">
                {thinkContent}
              </div>
            )}
          </div>
        )}

        {/* Main Answer Bubble with Rich Markdown Formatting */}
        <div
          className={cn(
            'p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed shadow-md relative group font-sans',
            isUser
              ? 'bg-[#77BA99] text-[#1d1e25] font-medium rounded-tr-xs border border-[#64a384]'
              : 'bg-[#262730] border border-[#3d3e4b] text-[#EFF0D1] rounded-tl-xs shadow-md'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-[#1d1e25] font-medium">{mainContent}</p>
          ) : (
            <FormattedMessage content={mainContent} />
          )}

          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1 text-[#D7C0D0] hover:text-[#EFF0D1] bg-[#1d1e25] hover:bg-[#32333e] border border-[#3d3e4b] rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-xs"
              title="Copy answer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#77BA99]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Citations & Schematics */}
        {message.citations && message.citations.length > 0 && (
          <div className="space-y-1 pt-0.5">
            <p className="text-[10px] font-bold text-[#D7C0D0] uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-[#77BA99]" />
              Verified Document Citations ({message.citations.length})
            </p>
            <div className="space-y-1">
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
