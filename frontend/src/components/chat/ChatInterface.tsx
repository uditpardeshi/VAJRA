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
  Sparkles,
  Bot,
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

export interface ChatInterfaceProps {
  machines: Machine[]
  selectedMachineId: string
  onSelectMachine: (id: string) => void
}

interface QuickAction {
  icon: React.ReactNode
  title: string
  desc: string
  query: string
  colorTheme: 'emerald' | 'sky' | 'purple' | 'amber'
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
  const [reasoningEnabled, setReasoningEnabled] = useState(true)
  const [isListening, setIsListening] = useState(false)

  const { mutateAsync: sendChat, isPending } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const quickActions: QuickAction[] = [
    {
      icon: <Gauge className="w-4 h-4 text-emerald-600 shrink-0" />,
      title: 'Spindle Runout Limits',
      desc: 'Dial indicator calibration & ISO tolerance thresholds',
      query: `What is the acceptable spindle runout limit and dial indicator measurement procedure for ${currentMachineId}?`,
      colorTheme: 'emerald',
    },
    {
      icon: <Droplets className="w-4 h-4 text-sky-600 shrink-0" />,
      title: 'Hydraulic Pressure Checks',
      desc: 'Operating PSI thresholds & accumulator pre-charge limits',
      query: `What is the standard hydraulic operating pressure and check procedure for ${currentMachineId}?`,
      colorTheme: 'sky',
    },
    {
      icon: <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0" />,
      title: 'Emergency E-Stop Protocol',
      desc: 'Thermal shutdown & interlock recovery steps',
      query: `What is the emergency shutdown procedure for spindle overheating above 85C on ${currentMachineId}?`,
      colorTheme: 'purple',
    },
    {
      icon: <Wrench className="w-4 h-4 text-amber-600 shrink-0" />,
      title: 'Bearing Service Milestones',
      desc: 'Grease specifications & scheduled replacement guides',
      query: `What is the bearing replacement interval and grease specification for ${currentMachineId}?`,
      colorTheme: 'amber',
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

  const submitQuestion = async (queryText: string) => {
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
      const res = await sendChat({
        question: queryText,
        machine_id: currentMachineId || undefined,
        session_id: activeSession.id,
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
      .map((m) => `### ${m.role === 'user' ? 'Technician' : 'VAJRA Assistant'} (${new Date(m.timestamp).toLocaleString()}):\n\n${m.content}\n\n`)
      .join('---\n\n')
    const blob = new Blob([`# Technical Inquiry: ${activeSession.title}\nMachine: ${currentMachineId}\nExported: ${new Date().toLocaleString()}\n\n---\n\n${content}`], {
      type: 'text/markdown',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vajra-chat-${activeSession.id.slice(0, 8)}.md`
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
      className="relative flex h-full w-full min-w-0 bg-transparent rounded-none md:rounded-3xl border-0 md:border md:border-slate-200/70 md:shadow-soft overflow-hidden"
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
        <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 border-2 border-dashed border-primary animate-in fade-in duration-150">
          <UploadCloud className="w-12 h-12 text-primary animate-bounce mb-2" />
          <h3 className="text-lg font-bold">Drop Technical Files Here</h3>
          <p className="text-xs sm:text-sm text-slate-300 text-center">
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
      <div className="flex-1 flex flex-col min-w-0 h-full bg-white/75 backdrop-blur-md">
        {/* Top Header Bar: Clean, Spacious, Zero Overlapping */}
        <div className="px-3 sm:px-5 py-2.5 border-b border-slate-200/70 flex items-center justify-between gap-3 bg-white/90 backdrop-blur-md shrink-0">
          {/* Left: Thread Drawer Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all shrink-0 shadow-2xs',
                isSidebarOpen
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
              )}
              title="Toggle Conversation Threads"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Threads</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] font-mono font-bold text-slate-700">
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
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Export Chat Pill Button */}
            <button
              type="button"
              onClick={handleExportChat}
              disabled={messages.length === 0}
              className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 rounded-full text-xs font-semibold transition-all shadow-2xs shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Export conversation history"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Clear thread history button */}
            <button
              type="button"
              onClick={() => activeSession && clearSessionMessages(activeSession.id)}
              disabled={messages.length === 0}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors text-xs shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Clear thread messages"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages Stream & Welcoming Hero */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-5">
          {/* Visual Quick Action Center (When starting or thread is empty) */}
          {messages.length === 0 && (
            <div className="max-w-2xl mx-auto pt-2 sm:pt-6 pb-2 space-y-5">
              {/* Centered Friendly 3D-styled Bot Orb */}
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-sky-400 via-primary to-blue-600 flex items-center justify-center text-white shadow-xl ring-8 ring-sky-100/70">
                    <Bot className="w-9 h-9 sm:w-11 sm:h-11 text-white animate-pulse" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center text-white">
                    <Sparkles className="w-3 h-3" />
                  </div>
                </div>

                {/* Welcoming Header Typography */}
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200/60 text-xs font-semibold">
                    <span>VAJRA Sovereign Technical Assistant</span>
                  </div>
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                    How Can I Assist Your Operations Today?
                  </h1>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Select a diagnostic protocol below or ask any equipment tolerance inquiry:
                  </p>
                </div>
              </div>

              {/* 4 Pastel Quick Action Feature Cards (Clean, Punchy, Visual) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickActions.map((action, idx) => {
                  const themeClasses = {
                    emerald: 'bg-emerald-50/70 hover:bg-emerald-50/90 border-emerald-200/80 text-emerald-950',
                    sky: 'bg-sky-50/70 hover:bg-sky-50/90 border-sky-200/80 text-sky-950',
                    purple: 'bg-purple-50/70 hover:bg-purple-50/90 border-purple-200/80 text-purple-950',
                    amber: 'bg-amber-50/70 hover:bg-amber-50/90 border-amber-200/80 text-amber-950',
                  }[action.colorTheme]

                  const badgeClasses = {
                    emerald: 'bg-emerald-200/80 text-emerald-800',
                    sky: 'bg-sky-200/80 text-sky-800',
                    purple: 'bg-purple-200/80 text-purple-800',
                    amber: 'bg-amber-200/80 text-amber-800',
                  }[action.colorTheme]

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => submitQuestion(action.query)}
                      className={cn(
                        'p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between shadow-2xs hover:shadow-xs active:scale-98',
                        themeClasses
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-xl bg-white/90 shadow-2xs border border-white shrink-0">
                            {action.icon}
                          </div>
                          <span className="text-xs sm:text-sm font-bold truncate">
                            {action.title}
                          </span>
                        </div>
                        <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0', badgeClasses)}>
                          +
                        </span>
                      </div>
                      <p className="text-[11px] opacity-85 leading-relaxed mt-2.5">
                        {action.desc}
                      </p>
                    </button>
                  )
                })}
              </div>

              {/* Horizontal Category Quick Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
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
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shrink-0 shadow-2xs',
                      pill.machineId && pill.machineId === currentMachineId
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white/90 hover:bg-slate-100/80 text-slate-700 border-slate-200/80'
                    )}
                  >
                    <span>{pill.label}</span>
                  </button>
                ))}
              </div>

              {/* Sovereign Fleet Status Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50/80 via-white to-indigo-50/70 border border-sky-100 shadow-2xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      Sovereign AI Engine Active
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      3 OEM machines connected. 100% on-premise multimodal RAG.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => submitQuestion(`Run full diagnostic checklist for ${currentMachineId}.`)}
                  className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-2xs shrink-0"
                >
                  Diagnostics
                </button>
              </div>
            </div>
          )}

          {/* Quick Filter Strip for Ongoing Conversations */}
          {messages.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
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
                    'px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all shrink-0 shadow-2xs',
                    pill.machineId && pill.machineId === currentMachineId
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
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

          {/* Industrial Multi-Step Reasoning Stepper */}
          {isPending && (
            <ThinkingProgress
              machineId={currentMachineId}
              hasFiles={attachedFiles.length > 0}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Dock Input Bar */}
        <div className="p-2.5 sm:p-4 shrink-0 max-w-3xl mx-auto w-full">
          <div className="glass-dock rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 space-y-2">
            {/* Active Attached Files Chips */}
            {attachedFiles.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 hidden sm:inline">
                  Attached:
                </span>
                {attachedFiles.map((file) => (
                  <div
                    key={file.filename}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 shadow-2xs shrink-0"
                  >
                    {getFileIcon(file.filename)}
                    <span className="font-semibold text-[11px] truncate max-w-[120px] sm:max-w-[160px]" title={file.filename}>
                      {file.filename}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-slate-200/70 rounded text-slate-600 font-mono font-medium">
                      {file.total_chunks}c
                    </span>
                    {file.tables > 0 && (
                      <span className="text-[9px] px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold">
                        {file.tables}T
                      </span>
                    )}
                    {file.figures > 0 && (
                      <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-800 rounded font-semibold">
                        {file.figures}F
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => activeSession && removeFileFromSession(activeSession.id, file.filename)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 ml-0.5 transition-colors"
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
                  'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium animate-in fade-in',
                  uploadStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                )}
              >
                {uploadStatus.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                )}
                <span className="truncate">{uploadStatus.message}</span>
              </div>
            )}

            {/* Main Input Form */}
            <form onSubmit={handleSend} className="space-y-2">
              <div className="relative flex items-center px-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask equipment question or initiate diagnosis..."
                  className="w-full bg-transparent border-0 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 py-1.5 sm:py-2"
                />
              </div>

              {/* Bottom Actions Row */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 px-1">
                {/* Left Action Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {/* Attach File Pill */}
                  <button
                    type="button"
                    disabled={isUploading || isPending}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/60 text-slate-600 hover:text-slate-900 text-[11px] font-semibold transition-all shrink-0 whitespace-nowrap"
                    title="Attach technical files (PDF, Excel, Word, CSV, Images)"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    ) : (
                      <Paperclip className="w-3 h-3" />
                    )}
                    <span>Attach</span>
                  </button>

                  {/* Spec Table Pill */}
                  <button
                    type="button"
                    onClick={() => submitQuestion(`Extract full engineering spec table for ${currentMachineId}.`)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/60 text-slate-600 hover:text-slate-900 text-[11px] font-semibold transition-all shrink-0 whitespace-nowrap"
                    title="Quick Spec Table Lookup"
                  >
                    <Table className="w-3 h-3" />
                    <span>Specs</span>
                  </button>

                  {/* Reasoning Toggle Pill */}
                  <button
                    type="button"
                    onClick={() => setReasoningEnabled(!reasoningEnabled)}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all shrink-0 whitespace-nowrap',
                      reasoningEnabled
                        ? 'bg-sky-50 text-primary border-sky-200'
                        : 'bg-slate-100/80 text-slate-500 border-slate-200/60 hover:bg-slate-200/70'
                    )}
                    title="Toggle multi-step engineering reasoning"
                  >
                    <Cpu className="w-3 h-3" />
                    <span>Reasoning</span>
                  </button>
                </div>

                {/* Right Action Icons: Mic + Send Button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Voice Button */}
                  <button
                    type="button"
                    onClick={toggleSpeechInput}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors',
                      isListening && 'text-rose-600 bg-rose-50 animate-pulse'
                    )}
                    title={isListening ? 'Stop listening' : 'Voice input'}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>

                  {/* Primary Circular Send Button */}
                  <button
                    type="submit"
                    disabled={isPending || !input.trim()}
                    className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-gradient-to-tr from-sky-500 via-primary to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-35 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-xs transition-transform active:scale-95 shrink-0"
                    title="Send Inquiry"
                  >
                    <Send className="w-3.5 h-3.5 ml-0.5" />
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
