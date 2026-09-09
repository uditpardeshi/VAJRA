import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, Loader2 } from 'lucide-react'
import type { ChatMessage as ChatMessageType, Machine } from '@/types/api'
import { ChatMessage } from './ChatMessage'
import { MachineSelector } from '@/components/common/MachineSelector'
import { MachineContextBadge } from './MachineContextBadge'
import { Button } from '@/components/ui/Button'
import { useChat } from '@/hooks/api/useChat'

export interface ChatInterfaceProps {
  machines: Machine[]
  selectedMachineId: string
  onSelectMachine: (id: string) => void
}

export function ChatInterface({ machines, selectedMachineId, onSelectMachine }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your On-Premise Industrial Assistant. Ask me anything about machine specifications, operating limits, or maintenance manuals.',
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const { mutateAsync: sendChat, isPending } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isPending) return

    const userMsg: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    const question = input
    setInput('')

    try {
      const res = await sendChat({ question, machine_id: selectedMachineId || undefined })
      const botMsg: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer,
        citations: res.citations,
        confidence: res.confidence,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I failed to generate an answer. Please verify local backend status.',
          timestamp: new Date().toISOString(),
        },
      ])
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
      {/* Header toolbar */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm text-slate-800">Equipment QA Assistant</span>
        </div>
        <MachineSelector machines={machines} value={selectedMachineId} onChange={onSelectMachine} className="w-60" />
      </div>

      {/* Context pill */}
      {selectedMachineId && (
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/30">
          <MachineContextBadge machineId={selectedMachineId} />
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isPending && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 p-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Searching manual vectors &amp; reasoning...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about machine specs or repair..."
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
        />
        <Button type="submit" variant="primary" disabled={isPending || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
