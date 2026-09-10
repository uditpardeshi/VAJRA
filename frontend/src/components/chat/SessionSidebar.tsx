import React, { useState } from 'react'
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  FileText,
  Clock,
  Search,
  Cpu,
  ShieldCheck,
} from 'lucide-react'
import { useChatSessionStore } from '@/store/chatSessionStore'
import { cn } from '@/utils/cn'

export interface SessionSidebarProps {
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

export function SessionSidebar({ isOpen = false, onClose, className }: SessionSidebarProps) {
  const {
    sessions,
    activeSessionId,
    createSession,
    switchSession,
    deleteSession,
    renameSession,
  } = useChatSessionStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  if (!isOpen) return null

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.machine_id && s.machine_id.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleStartEdit = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation()
    setEditingId(id)
    setEditingTitle(currentTitle)
  }

  const handleSaveEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (editingTitle.trim()) {
      renameSession(id, editingTitle.trim())
    }
    setEditingId(null)
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(null)
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (sessions.length > 1) {
      deleteSession(id)
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[86%] max-w-xs md:static md:w-72 md:z-auto bg-[#1d1e25] backdrop-blur-xl border-r border-[#3d3e4b] flex flex-col shrink-0 h-full select-none shadow-2xl md:shadow-none animate-in slide-in-from-left duration-200 text-[#EFF0D1]',
          className
        )}
      >
        {/* Top action bar */}
        <div className="p-3 border-b border-[#3d3e4b] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6.5 h-6.5 rounded-lg bg-[#262730] border border-[#3d3e4b] flex items-center justify-center text-[#77BA99] shadow-2xs">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-[#EFF0D1] tracking-tight">Diagnostic Logs</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  createSession()
                  onClose?.()
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#77BA99] hover:bg-[#88caa9] text-[#1d1e25] font-bold rounded-lg text-xs transition-all shadow-xs active:scale-95"
                title="Create New Thread"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1 text-[#D7C0D0] hover:text-[#EFF0D1] hover:bg-[#32333e] rounded-lg md:hidden transition-colors"
                title="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#D7C0D0]/60 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search diagnostic logs..."
              className="w-full pl-8 pr-2.5 py-1 bg-[#262730] border border-[#3d3e4b] rounded-lg text-xs text-[#EFF0D1] placeholder:text-[#D7C0D0]/50 focus:outline-none focus:ring-1 focus:ring-[#77BA99] focus:border-[#77BA99] transition-all"
            />
          </div>
        </div>

        {/* Section Header */}
        <div className="px-3 pt-2 pb-1 flex items-center justify-between text-[10px] font-bold text-[#D7C0D0] uppercase tracking-wider">
          <span>Recent Threads</span>
          <span className="font-mono text-[9px] font-normal lowercase text-[#D7C0D0]/70">{sessions.length} active</span>
        </div>

        {/* Session list scroll area */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId
            const isEditing = editingId === session.id
            const fileCount = session.files?.length || 0

            return (
              <div
                key={session.id}
                onClick={() => {
                  switchSession(session.id)
                  onClose?.()
                }}
                className={cn(
                  'group relative p-2 rounded-lg border transition-all cursor-pointer flex flex-col gap-1',
                  isActive
                    ? 'bg-[#77BA99]/15 border-[#77BA99]/60 text-[#EFF0D1] shadow-xs'
                    : 'bg-[#262730] hover:bg-[#32333e] border-[#3d3e4b] text-[#D7C0D0]'
                )}
              >
                <div className="flex items-center justify-between gap-1.5">
                  {isEditing ? (
                    <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1 px-1.5 py-0.5 text-xs bg-slate-800 border border-sky-500 text-slate-100 rounded focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(e as any, session.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => handleSaveEdit(e, session.id)}
                        className="p-1 hover:text-emerald-400"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={handleCancelEdit} className="p-1 hover:text-rose-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span
                        className={cn(
                          'text-xs font-medium truncate flex-1',
                          isActive ? 'text-slate-100 font-bold' : 'text-slate-300'
                        )}
                      >
                        {session.title}
                      </span>

                      {/* Action buttons on hover or active */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleStartEdit(e, session.id, session.title)}
                          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
                          title="Rename Thread"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {sessions.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, session.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded"
                            title="Delete Thread"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Metadata row */}
                <div className="flex items-center gap-1.5 text-[10px] text-[#D7C0D0]">
                  {session.machine_id && (
                    <span className="px-1.5 py-0.2 bg-[#1d1e25] text-[#77BA99] border border-[#3d3e4b] rounded text-[9px] font-mono font-semibold">
                      {session.machine_id}
                    </span>
                  )}
                  {fileCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[#77BA99] font-semibold text-[10px]">
                      <FileText className="w-2.5 h-2.5" />
                      {fileCount} {fileCount === 1 ? 'doc' : 'docs'}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5 ml-auto text-[9px] text-[#D7C0D0]/70 font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(session.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })}

          {filteredSessions.length === 0 && (
            <div className="p-4 text-center text-xs text-[#D7C0D0]">
              No diagnostic logs found.
            </div>
          )}
        </div>

        {/* Bottom status card */}
        <div className="p-2.5 border-t border-[#3d3e4b] bg-[#1d1e25]">
          <div className="p-2.5 rounded-xl bg-[#262730] border border-[#3d3e4b] space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#77BA99]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>OEM Archive Synchronized</span>
            </div>
            <p className="text-[10px] text-[#D7C0D0] leading-tight">
              Machine specifications &amp; ISO tolerance parameters loaded.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
