import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Loader2,
  PanelLeft,
  PanelLeftClose,
  RotateCcw,
  Paperclip,
  Plus,
  BookOpen,
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
      className="relative flex h-full w-full min-w-0 bg-[#1a1b23] rounded-none md:rounded-xl border-0 md:border md:border-[#2e303d] overflow-hidden"
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
      <div className="flex-1 flex flex-col min-w-0 h-full bg-[#181920]">
        {/* Top Header Bar: Clean, Compact, Zero Clutter */}
        <div className="px-3 sm:px-4 py-2 border-b border-[#2e303d] flex items-center justify-between gap-2 bg-[#1e1f29] shrink-0">
          {/* Left: Thread Drawer Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                isSidebarOpen
                  ? 'bg-[#77BA99]/15 text-[#77BA99] font-semibold'
                  : 'bg-[#262730] text-[#EFF0D1] hover:bg-[#2c2e3a]'
              )}
              title="Toggle Conversation Threads"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Threads</span>
              <span className="text-[10px] text-[#D7C0D0]/70">
                ({sessions.length})
              </span>
            </button>
          </div>

          {/* Center: Machine Context Selector */}
          <div className="flex-1 max-w-sm flex justify-center min-w-0">
            <MachineSelector
              machines={machines}
              value={currentMachineId}
              onChange={handleMachineChange}
              className="w-full max-w-xs text-xs"
            />
          </div>

          {/* Right: Actions (Export & Clear) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleExportChat}
              disabled={messages.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#262730] hover:bg-[#2c2e3a] text-[#EFF0D1] rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Export conversation history"
            >
              <Download className="w-3.5 h-3.5 text-[#D7C0D0]" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              type="button"
              onClick={() => activeSession && clearSessionMessages(activeSession.id)}
              disabled={messages.length === 0}
              className="p-1.5 text-[#D7C0D0] hover:text-[#EFF0D1] hover:bg-[#262730] rounded-lg transition-colors text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              title="Clear messages"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages Stream & Welcoming Hero */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-3 sm:space-y-4">
          {/* Clean Modern Empty State */}
          {messages.length === 0 && (
            <div className="max-w-xl mx-auto pt-8 sm:pt-12 pb-4 text-center space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-[#22232d] border border-[#2e303d] flex items-center justify-center text-[#77BA99] mx-auto shadow-xs">
                <BookOpen className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-base sm:text-lg font-bold text-[#EFF0D1]">
                  Equipment Manuals &amp; Technical Specs
                </h2>
                <p className="text-xs text-[#D7C0D0]/80 max-w-md mx-auto">
                  Search tolerances, operating parameters, torque limits, and maintenance procedures for <span className="font-semibold text-[#EFF0D1]">{currentMachineId}</span>.
                </p>
              </div>

              {/* Clean Starter Queries */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2">
                {[
                  {
                    title: 'Spindle Runout Limit',
                    desc: 'Acceptable tolerance and dial indicator check',
                    query: `What is the acceptable spindle runout limit and measurement procedure for ${currentMachineId}?`,
                  },
                  {
                    title: 'Hydraulic System Pressure',
                    desc: 'Operating pressure and accumulator thresholds',
                    query: `What is the standard hydraulic operating pressure for ${currentMachineId}?`,
                  },
                  {
                    title: 'Emergency Shutdown Protocol',
                    desc: 'Spindle overheating and thermal cutoff procedure',
                    query: `What is the emergency shutdown procedure for spindle overheating on ${currentMachineId}?`,
                  },
                  {
                    title: 'Bearing Service Schedule',
                    desc: 'Grease specification and replacement interval',
                    query: `What is the bearing replacement interval and grease specification for ${currentMachineId}?`,
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => submitQuestion(item.query)}
                    className="p-3 rounded-xl bg-[#22232d] hover:bg-[#262730] border border-[#2e303d] hover:border-[#77BA99]/50 text-left transition-all group shadow-2xs flex flex-col justify-between"
                  >
                    <span className="text-xs font-semibold text-[#EFF0D1] group-hover:text-white block">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-[#D7C0D0]/60 mt-1 block">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
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
            <form onSubmit={handleSend} className="space-y-2">
              <div className="relative flex items-center px-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Ask a question about ${currentMachineId} specifications, tolerances, or procedures...`}
                  className="w-full bg-transparent border-0 text-xs sm:text-sm text-[#EFF0D1] placeholder:text-[#D7C0D0]/50 focus:outline-none focus:ring-0 py-1 font-normal"
                />
              </div>

              {/* Actions Row */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#2e303d] px-1">
                {/* Left Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isUploading || isPending}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#262730] hover:bg-[#2c2e3a] text-[#EFF0D1] text-[11px] font-medium transition-colors"
                    title="Attach technical files (PDF, Excel, Word, CSV, Images)"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#77BA99]" />
                    ) : (
                      <Paperclip className="w-3.5 h-3.5 text-[#D7C0D0]" />
                    )}
                    <span>Attach</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleReasoning}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                      reasoningEnabled
                        ? 'bg-[#77BA99]/15 text-[#77BA99] font-semibold'
                        : 'bg-[#262730] text-[#D7C0D0]/70 hover:text-[#EFF0D1]'
                    )}
                    title={
                      reasoningEnabled
                        ? 'Engineering reasoning trace enabled'
                        : 'Direct response mode active'
                    }
                  >
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-colors',
                        reasoningEnabled ? 'bg-[#77BA99]' : 'bg-[#D7C0D0]/40'
                      )}
                    />
                    <span>{reasoningEnabled ? 'Trace: ON' : 'Trace: OFF'}</span>
                  </button>
                </div>

                {/* Right Action Icons: Language + Mic + Send Button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Language Selector */}
                  <LanguageSelector value={voiceLanguage} onChange={setVoiceLanguage} />

                  <button
                    type="button"
                    onClick={toggleSpeechInput}
                    className={cn(
                      'w-7 h-7 rounded-md flex items-center justify-center text-[#D7C0D0] hover:text-[#EFF0D1] hover:bg-[#262730] transition-colors',
                      isListening && 'text-[#D33F49] bg-[#D33F49]/20 animate-pulse border border-[#D33F49]/40'
                    )}
                    title={isListening ? 'Stop recording' : 'Voice input (Click to speak)'}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="submit"
                    disabled={isPending || !input.trim()}
                    className="w-7 h-7 rounded-md bg-[#77BA99] hover:bg-[#88caa9] active:bg-[#65a384] disabled:opacity-30 disabled:cursor-not-allowed text-[#1a1b23] flex items-center justify-center transition-colors shadow-2xs"
                    title="Send inquiry"
                  >
                    <Send className="w-3.5 h-3.5" />
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

