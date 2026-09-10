import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Loader2,
  PanelLeft,
  PanelLeftClose,
  RotateCcw,
  Paperclip,
  Plus,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCode,
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Gauge,
  Droplets,
  AlertTriangle,
  Wrench,
  Download,
  Mic,
  MicOff,
  Cpu,
  Table,
  Search,
  ArrowUpRight,
  Activity,
  ShieldCheck,
} from 'lucide-react'
import type { ChatMessage as ChatMessageType, Machine, SessionFileItem } from '@/types/api'
import { ChatMessage } from './ChatMessage'
import { ThinkingProgress } from './ThinkingProgress'
import { MachineSelector } from '@/components/common/MachineSelector'
import { useChat } from '@/hooks/api/useChat'
import { useChatSessionStore } from '@/store/chatSessionStore'
import { SessionSidebar } from './SessionSidebar'
import { api } from '@/config/api'
import { cn } from '@/utils/cn'

import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { LanguageSelector } from '@/components/voice/LanguageSelector'

export interface ChatInterfaceProps {
  machines: Machine[]
  selectedMachineId: string
  onSelectMachine: (id: string) => void
}

interface QuickAction {
  code: string
  icon: React.ReactNode
  title: string
  desc: string
  query: string
}

export function ChatInterface({ machines, selectedMachineId, onSelectMachine }: ChatInterfaceProps) {
  const {
    sessions,
    activeSessionId,
    createSession,
    addMessageToSession,
    clearSessionMessages,
    updateSessionMachine,
    addFilesToSession,
    removeFileFromSession,
  } = useChatSessionStore()

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0]
  const currentMachineId = activeSession?.machine_id || selectedMachineId || 'HX-204'
  const messages = (activeSession?.messages || []).filter((m) => m.id !== 'welcome')
  const attachedFiles = activeSession?.files || []

  const [input, setInput] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [voiceLanguage, setVoiceLanguage] = useState('en-IN')
  const [reasoningEnabled, setReasoningEnabled] = useState(() => {
    const saved = localStorage.getItem('vajra_reasoning_enabled')
    return saved !== null ? saved === 'true' : true
  })

  const toggleReasoning = () => {
    setReasoningEnabled((prev) => {
      const next = !prev
      localStorage.setItem('vajra_reasoning_enabled', String(next))
      return next
    })
  }

  const { mutateAsync: sendChat, isPending } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { state: speechState, transcript: liveTranscript, confidence: speechConfidence, start: startSpeech, stop: stopSpeech, isListening } = useSpeechRecognition({
    language: voiceLanguage,
    continuous: true,
    interimResults: true,
    onResult: (result) => {
      if (result.transcript) {
        setInput(result.transcript)
      }
      if (result.isFinal && result.transcript.trim()) {
        submitQuestion(result.transcript, true, result.confidence)
        stopSpeech()
      }
    },
  })

  const toggleSpeechInput = () => {
    if (isListening) {
      stopSpeech()
    } else {
      startSpeech()
    }
  }

  const quickActions: QuickAction[] = [
    {
      code: 'PRT-01',
      icon: <Gauge className="w-4 h-4 text-[#77BA99] shrink-0" />,
      title: 'Spindle Runout Limits',
      desc: 'Dial indicator calibration & ISO 230-2 tolerance thresholds',
      query: `What is the acceptable spindle runout limit and dial indicator measurement procedure for ${currentMachineId}?`,
    },
    {
      code: 'PRT-02',
      icon: <Droplets className="w-4 h-4 text-[#77BA99] shrink-0" />,
      title: 'Hydraulic System Pressure',
      desc: 'Operating bar thresholds & accumulator pre-charge limits',
      query: `What is the standard hydraulic operating pressure and check procedure for ${currentMachineId}?`,
    },
    {
      code: 'PRT-03',
      icon: <AlertTriangle className="w-4 h-4 text-[#D33F49] shrink-0" />,
      title: 'Emergency E-Stop Protocol',
      desc: 'Thermal shutdown & interlock recovery steps',
      query: `What is the emergency shutdown procedure for spindle overheating above 85C on ${currentMachineId}?`,
    },
    {
      code: 'PRT-04',
      icon: <Wrench className="w-4 h-4 text-[#77BA99] shrink-0" />,
      title: 'Bearing Service Milestones',
      desc: 'Grease specifications & scheduled replacement guides',
      query: `What is the bearing replacement interval and grease specification for ${currentMachineId}?`,
    },
  ]

  const categoryPills = [
    { label: 'CNC-500', machineId: 'CNC-500' },
    { label: 'HX-204', machineId: 'HX-204' },
    { label: 'LATHE-3', machineId: 'LATHE-3' },
    { label: 'Tolerances', query: `What are the critical machining tolerances for ${currentMachineId}?` },
    { label: 'Hydraulics', query: `Provide hydraulic accumulator check steps for ${currentMachineId}.` },
    { label: 'Spec Table', query: `Show full operating specification table for ${currentMachineId}.` },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isPending])

  const handleMachineChange = (id: string) => {
    onSelectMachine(id)
    if (activeSession) {
      updateSessionMachine(activeSession.id, id)
    }
  }

  const handleUploadFiles = async (filesToUpload: FileList | File[]) => {
    if (!filesToUpload || filesToUpload.length === 0 || !activeSession) return
    setIsUploading(true)
    setUploadStatus(null)

    const formData = new FormData()
    Array.from(filesToUpload).forEach((f) => formData.append('files', f))
    formData.append('session_id', activeSession.id)

    try {
      const res = await api.post<{ session_id: string; files: SessionFileItem[]; total_indexed: number }>(
        '/chat/upload',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        }
      )

      if (res.data?.files) {
        addFilesToSession(activeSession.id, res.data.files)
        setUploadStatus({
          type: 'success',
          message: `Indexed ${res.data.files.length} document(s) (${res.data.total_indexed} chunks) into RAG`,
        })
        setTimeout(() => setUploadStatus(null), 4000)
      }
    } catch (err: any) {
      setUploadStatus({
        type: 'error',
        message: err.response?.data?.detail || err.message || 'Upload failed',
      })
      setTimeout(() => setUploadStatus(null), 5000)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const submitQuestion = async (queryText: string, isVoice = false, voiceConfidence = 0.95) => {
    if (!queryText.trim() || isPending || !activeSession) return

    const userMsg: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText,
      timestamp: new Date().toISOString(),
    }

    addMessageToSession(activeSession.id, userMsg)
    setInput('')

    try {
      // Pass full conversation memory for this specific chat
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await sendChat({
        question: queryText,
        machine_id: currentMachineId || undefined,
        session_id: activeSession.id,
        reasoning: reasoningEnabled,
        history: historyPayload,
        source: isVoice ? 'voice' : 'text',
        voice_confidence: isVoice ? voiceConfidence : undefined,
        language: voiceLanguage,
      })

      const botMsg: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer,
        citations: res.citations,
        confidence: res.confidence,
        timestamp: new Date().toISOString(),
      }
      addMessageToSession(activeSession.id, botMsg)
    } catch {
      addMessageToSession(activeSession.id, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Unable to process query with the connected model endpoint. Please verify ngrok status or API key in Settings.',
        timestamp: new Date().toISOString(),
      })
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    submitQuestion(input)
  }

  const handleExportChat = () => {
    if (!activeSession || messages.length === 0) return
    const content = messages
      .map((m) => `### ${m.role === 'user' ? 'Operator' : 'VAJRA Diagnostic System'} (${new Date(m.timestamp).toLocaleString()}):\n\n${m.content}\n\n`)
      .join('---\n\n')
    const blob = new Blob([`# Diagnostic Log: ${activeSession.title}\nMachine: ${currentMachineId}\nExported: ${new Date().toLocaleString()}\n\n---\n\n${content}`], {
      type: 'text/markdown',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vajra-diagnostic-${activeSession.id.slice(0, 8)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleSpeechInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files)
    }
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) return <ImageIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
    if (['json', 'yaml', 'yml'].includes(ext || '')) return <FileCode className="w-3.5 h-3.5 text-blue-500 shrink-0" />
    return <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex h-full w-full min-w-0 bg-[#0a0e17] rounded-none md:rounded-2xl border-0 md:border md:border-slate-800 md:shadow-xl overflow-hidden"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md,.json,.png,.jpg,.jpeg"
        onChange={(e) => handleUploadFiles(e.target.files || [])}
        className="hidden"
      />

      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 border-2 border-dashed border-sky-400 animate-in fade-in duration-150">
          <UploadCloud className="w-10 h-10 text-sky-400 animate-bounce mb-2" />
          <h3 className="text-base sm:text-lg font-bold">Drop Technical Files Here</h3>
          <p className="text-xs text-slate-300 text-center">
            PDFs, Excel/CSV sheets, Word docs, Schematics, or TXT
          </p>
        </div>
      )}

      {/* Collapsible Session Sidebar */}
      <SessionSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-[#1d1e25]">
        {/* Top Header Bar: Clean, Compact, Zero Overlapping */}
        <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 border-b border-[#3d3e4b] flex items-center justify-between gap-2 bg-[#262730]/95 backdrop-blur-md shrink-0">
          {/* Left: Thread Drawer Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all shrink-0 shadow-xs',
                isSidebarOpen
                  ? 'bg-[#77BA99]/20 text-[#77BA99] border-[#77BA99]/60 font-bold'
                  : 'bg-[#1d1e25] text-[#EFF0D1] border-[#3d3e4b] hover:bg-[#32333e] hover:text-white'
              )}
              title="Toggle Conversation Threads"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Threads</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#262730] text-[10px] font-mono font-bold text-[#77BA99]">
                {sessions.length}
              </span>
            </button>
          </div>

          {/* Center: Machine Context Pill Selector */}
          <div className="flex-1 max-w-md flex justify-center min-w-0">
            <MachineSelector
              machines={machines}
              value={currentMachineId}
              onChange={handleMachineChange}
              className="w-full max-w-xs"
            />
          </div>

          {/* Right: Actions (Export & Clear) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Export Chat Pill Button */}
            <button
              type="button"
              onClick={handleExportChat}
              disabled={messages.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#1d1e25] hover:bg-[#32333e] border border-[#3d3e4b] text-[#EFF0D1] rounded-full text-xs font-semibold transition-all shadow-xs shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Export diagnostic history"
            >
              <Download className="w-3.5 h-3.5 text-[#D7C0D0]" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Clear thread history button */}
            <button
              type="button"
              onClick={() => activeSession && clearSessionMessages(activeSession.id)}
              disabled={messages.length === 0}
              className="p-1 text-[#D7C0D0] hover:text-[#EFF0D1] hover:bg-[#32333e] rounded-full transition-colors text-xs shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Clear thread messages"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages Stream & Welcoming Hero */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-3 sm:space-y-4">
          {/* Equipment Console Action Center (When starting or thread is empty) */}
          {messages.length === 0 && (
            <div className="max-w-2xl mx-auto pt-1 sm:pt-3 pb-2 space-y-3.5">
              {/* Industrial Equipment Diagnostic Station Header */}
              <div className="rounded-xl bg-[#262730] border border-[#3d3e4b] p-3 sm:p-4 shadow-md space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3d3e4b] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#77BA99] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#77BA99]"></span>
                    </span>
                    <span className="text-xs font-mono font-bold tracking-wider text-[#EFF0D1] uppercase">
                      DIAGNOSTIC STATION · UNIT {currentMachineId}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1d1e25] text-[#77BA99] border border-[#77BA99]/40 font-semibold">
                      TELEMETRY LINKED
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] font-mono text-[#D7C0D0]">
                    <span>STD: <strong className="text-[#EFF0D1] font-semibold">ISO 230-2</strong></span>
                    <span className="text-[#3d3e4b]">|</span>
                    <span>TOL: <strong className="text-[#EFF0D1] font-semibold">DIN 8605</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-[#1d1e25] border border-[#3d3e4b]">
                    <div className="text-[10px] text-[#D7C0D0] uppercase font-mono">Max Runout</div>
                    <div className="text-xs sm:text-sm font-mono font-bold text-[#EFF0D1] mt-0.5">&le; 0.005 mm</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#1d1e25] border border-[#3d3e4b]">
                    <div className="text-[10px] text-[#D7C0D0] uppercase font-mono">Hydraulic Sys</div>
                    <div className="text-xs sm:text-sm font-mono font-bold text-[#EFF0D1] mt-0.5">35 - 55 bar</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#1d1e25] border border-[#3d3e4b]">
                    <div className="text-[10px] text-[#D7C0D0] uppercase font-mono">Spindle Temp</div>
                    <div className="text-xs sm:text-sm font-mono font-bold text-[#77BA99] mt-0.5">&lt; 65&deg;C (Norm)</div>
                  </div>
                </div>
              </div>

              {/* Standard Diagnostic Protocols Grid */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#D7C0D0] font-bold">
                    Diagnostic Protocols
                  </span>
                  <span className="text-[10px] font-mono text-[#77BA99]">
                    CLICK TO EXECUTE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => submitQuestion(action.query)}
                      className="p-3 rounded-lg border border-[#3d3e4b] bg-[#262730] hover:bg-[#32333e] hover:border-[#77BA99]/60 text-left transition-all group flex flex-col justify-between shadow-xs active:scale-98"
                    >
                      <div className="flex items-start justify-between gap-2 w-full">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-[#1d1e25] border border-[#3d3e4b] shrink-0">
                            {action.icon}
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#77BA99] font-bold block">
                              [{action.code}]
                            </span>
                            <span className="text-xs font-bold text-[#EFF0D1] group-hover:text-white transition-colors">
                              {action.title}
                            </span>
                          </div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#D7C0D0]/50 group-hover:text-[#77BA99] transition-colors shrink-0 mt-0.5" />
                      </div>
                      <p className="text-[11px] text-[#D7C0D0] group-hover:text-[#EFF0D1] leading-tight mt-2 font-normal">
                        {action.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Machine & Category Quick Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
                <span className="text-[10px] font-mono font-bold text-[#D7C0D0] uppercase tracking-wider shrink-0 mr-0.5">
                  PRESETS:
                </span>
                {categoryPills.map((pill, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (pill.machineId) {
                        handleMachineChange(pill.machineId)
                      } else if (pill.query) {
                        submitQuestion(pill.query)
                      }
                    }}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-semibold border transition-all shrink-0 shadow-xs',
                      pill.machineId && pill.machineId === currentMachineId
                        ? 'bg-[#77BA99]/25 text-[#77BA99] border-[#77BA99]/60 font-bold'
                        : 'bg-[#262730] hover:bg-[#32333e] text-[#EFF0D1] border-[#3d3e4b]'
                    )}
                  >
                    <span>{pill.label}</span>
                  </button>
                ))}
              </div>

              {/* OEM Archive Status Panel */}
              <div className="p-2.5 rounded-lg bg-[#1d1e25] border border-[#3d3e4b] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-[#77BA99] shrink-0" />
                  <span className="text-[#EFF0D1] text-[11px] truncate">
                    OEM Service Manuals &amp; Technical Specs Loaded for <strong className="text-white font-mono">{currentMachineId}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => submitQuestion(`Run full diagnostic verification checklist for ${currentMachineId}.`)}
                  className="px-2.5 py-1 bg-[#77BA99] hover:bg-[#88caa9] active:bg-[#65a384] text-[#1d1e25] rounded text-xs font-mono font-bold transition-colors shadow-xs shrink-0"
                >
                  RUN CHECK
                </button>
              </div>
            </div>
          )}

          {/* Quick Filter Strip for Ongoing Conversations */}
          {messages.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <span className="text-[10px] font-bold text-[#D7C0D0] uppercase tracking-wider shrink-0 mr-0.5">
                Quick:
              </span>
              {categoryPills.map((pill, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (pill.machineId) {
                      handleMachineChange(pill.machineId)
                    } else if (pill.query) {
                      submitQuestion(pill.query)
                    }
                  }}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all shrink-0 shadow-xs',
                    pill.machineId && pill.machineId === currentMachineId
                      ? 'bg-[#77BA99]/25 text-[#77BA99] border-[#77BA99]/60 font-bold'
                      : 'bg-[#262730] hover:bg-[#32333e] text-[#EFF0D1] border-[#3d3e4b]'
                  )}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          )}

          {/* Render Active Conversation Messages */}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {/* Industrial Multi-Step Reasoning Stepper or Direct Mode */}
          {isPending && (
            reasoningEnabled ? (
              <ThinkingProgress
                machineId={currentMachineId}
                hasFiles={attachedFiles.length > 0}
              />
            ) : (
              <div className="bg-[#262730] backdrop-blur-md rounded-xl border border-[#3d3e4b] p-2.5 sm:p-3 shadow-md max-w-xl mx-auto flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full border-2 border-[#77BA99] border-t-transparent animate-spin shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#EFF0D1] block">Direct Specification Mode</span>
                  <span className="text-[#D7C0D0] text-[11px]">Synthesizing immediate OEM specifications without chain-of-thought...</span>
                </div>
              </div>
            )
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Dock Input Bar (Compact, High Information Density, Mobile-Optimized) */}
        <div className="p-1.5 sm:p-3 shrink-0 max-w-3xl mx-auto w-full">
          <div className="glass-dock rounded-xl sm:rounded-2xl p-2 sm:p-2.5 space-y-1.5">
            {/* Active Attached Files Chips */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-1 border-b border-[#3d3e4b]">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#1d1e25] border border-[#3d3e4b] text-xs shadow-2xs group"
                  >
                    {file.filename.endsWith('.pdf') ? (
                      <FileText className="w-3.5 h-3.5 text-[#D33F49] shrink-0" />
                    ) : file.filename.match(/\.(xlsx|xls|csv)$/i) ? (
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#77BA99] shrink-0" />
                    ) : file.filename.match(/\.(png|jpg|jpeg|webp)$/i) ? (
                      <ImageIcon className="w-3.5 h-3.5 text-[#D7C0D0] shrink-0" />
                    ) : (
                      <FileCode className="w-3.5 h-3.5 text-[#77BA99] shrink-0" />
                    )}
                    <span className="max-w-[120px] truncate text-[11px] font-medium text-[#EFF0D1]">
                      {file.filename}
                    </span>
                    <button
                      type="button"
                      onClick={() => activeSession && removeFileFromSession(activeSession.id, file.filename)}
                      className="text-[#D7C0D0] hover:text-[#D33F49] p-0.5 ml-0.5 transition-colors"
                      title="Remove from thread"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload notifications */}
            {uploadStatus && (
              <div
                className={cn(
                  'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium animate-in fade-in',
                  uploadStatus.type === 'success'
                    ? 'bg-[#77BA99]/15 text-[#77BA99] border border-[#77BA99]/40'
                    : 'bg-[#D33F49]/15 text-[#D33F49] border border-[#D33F49]/40'
                )}
              >
                {uploadStatus.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#77BA99] shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-[#D33F49] shrink-0" />
                )}
                <span className="truncate">{uploadStatus.message}</span>
              </div>
            )}

            {/* Main Input Form */}
            <form onSubmit={handleSend} className="space-y-1.5">
              <div className="relative flex items-center px-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter diagnostic query or equipment parameter (e.g. Spindle runout check for HX-204)..."
                  className="w-full bg-transparent border-0 text-xs sm:text-sm text-[#EFF0D1] placeholder:text-[#D7C0D0]/50 focus:outline-none focus:ring-0 py-1 sm:py-1.5 font-normal"
                />
              </div>

              {/* Bottom Actions Row */}
              <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-[#3d3e4b] px-1">
                {/* Left Action Pills */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {/* Attach File Pill */}
                  <button
                    type="button"
                    disabled={isUploading || isPending}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#1d1e25] hover:bg-[#32333e] border border-[#3d3e4b] text-[#EFF0D1] text-[11px] font-semibold transition-all shrink-0 whitespace-nowrap"
                    title="Attach technical files (PDF, Excel, Word, CSV, Images)"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3 h-3 animate-spin text-[#77BA99]" />
                    ) : (
                      <Paperclip className="w-3 h-3 text-[#D7C0D0]" />
                    )}
                    <span>Attach</span>
                  </button>

                  {/* Spec Table Pill */}
                  <button
                    type="button"
                    onClick={() => submitQuestion(`Extract full engineering spec table for ${currentMachineId}.`)}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#1d1e25] hover:bg-[#32333e] border border-[#3d3e4b] text-[#EFF0D1] text-[11px] font-semibold transition-all shrink-0 whitespace-nowrap"
                    title="Quick Spec Table Lookup"
                  >
                    <Table className="w-3 h-3 text-[#D7C0D0]" />
                    <span>Specs</span>
                  </button>

                  {/* Diagnostic Trace Toggle Pill */}
                  <button
                    type="button"
                    onClick={toggleReasoning}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-[11px] font-semibold transition-all shrink-0 whitespace-nowrap',
                      reasoningEnabled
                        ? 'bg-[#77BA99]/20 text-[#77BA99] border-[#77BA99]/60 shadow-xs font-bold'
                        : 'bg-[#1d1e25] text-[#D7C0D0] border-[#3d3e4b] hover:bg-[#32333e] hover:text-[#EFF0D1]'
                    )}
                    title={
                      reasoningEnabled
                        ? 'Multi-Step Diagnostic Verification Trace Active (Click to switch to Direct Mode)'
                        : 'Direct Response Mode Active (Click to enable Diagnostic Verification Trace)'
                    }
                  >
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-colors',
                        reasoningEnabled ? 'bg-[#77BA99] animate-pulse' : 'bg-[#D7C0D0]/40'
                      )}
                    />
                    <Cpu className="w-3 h-3" />
                    <span>{reasoningEnabled ? 'Trace: ON' : 'Trace: OFF'}</span>
                  </button>
                </div>

                {/* Right Action Icons: Language + Mic + Run Button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Language Selector */}
                  <LanguageSelector value={voiceLanguage} onChange={setVoiceLanguage} />

                  {/* Voice Button */}
                  <button
                    type="button"
                    onClick={toggleSpeechInput}
                    className={cn(
                      'w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-md flex items-center justify-center text-[#D7C0D0] hover:text-[#EFF0D1] hover:bg-[#32333e] transition-colors relative',
                      isListening && 'text-[#D33F49] bg-[#D33F49]/20 animate-pulse border border-[#D33F49]/60 shadow-lg'
                    )}
                    title={isListening ? 'Stop voice recording' : 'Voice input (Click to speak)'}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>

                  {/* Primary Industrial Execute Button */}
                  <button
                    type="submit"
                    disabled={isPending || !input.trim()}
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md bg-[#77BA99] hover:bg-[#88caa9] active:bg-[#64a384] disabled:opacity-30 disabled:cursor-not-allowed text-[#1d1e25] flex items-center gap-1 text-xs font-bold font-mono transition-all shrink-0 shadow-xs"
                    title="Run Diagnostic Command"
                  >
                    <span>RUN</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

