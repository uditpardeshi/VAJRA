import React, { useState, useEffect } from 'react'
import { FileSearch, Cpu, CheckCircle2, ShieldCheck, Gauge, Sparkles } from 'lucide-react'

export interface ThinkingProgressProps {
  machineId?: string
  hasFiles?: boolean
}

interface Step {
  id: number
  title: string
  subtitle: string
  icon: React.ReactNode
}

export function ThinkingProgress({ machineId = 'HX-204', hasFiles = false }: ThinkingProgressProps) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const steps: Step[] = [
    {
      id: 1,
      title: 'Scanning Technical Manuals',
      subtitle: hasFiles
        ? `Cross-referencing ${machineId} manual & session documents...`
        : `Searching OEM technical documentation for ${machineId}...`,
      icon: <FileSearch className="w-4 h-4" />,
    },
    {
      id: 2,
      title: 'Extracting Tolerances & Schematics',
      subtitle: 'Isolating operating limits, pressure ratings, and diagrams...',
      icon: <Gauge className="w-4 h-4" />,
    },
    {
      id: 3,
      title: 'Reasoning & Verification',
      subtitle: 'Evaluating engineering constraints with Qwen neural core...',
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      id: 4,
      title: 'Formulating Actionable Steps',
      subtitle: 'Compiling verifiable procedure with source citations...',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
  ]

  // Calculate current active step based on elapsed seconds
  let activeStep = 1
  let progressPercent = 20

  if (seconds < 3) {
    activeStep = 1
    progressPercent = 25 + (seconds / 3) * 15
  } else if (seconds < 8) {
    activeStep = 2
    progressPercent = 40 + ((seconds - 3) / 5) * 25
  } else if (seconds < 18) {
    activeStep = 3
    progressPercent = 65 + ((seconds - 8) / 10) * 25
  } else {
    activeStep = 4
    progressPercent = 90 + Math.min(8, (seconds - 18) * 0.5)
  }

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const rem = sec % 60
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}s`
  }

  return (
    <div className="mr-auto max-w-2xl w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white/95 backdrop-blur-xl text-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-200/90 space-y-3">
        {/* Top bar: Status + Timer */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              VAJRA Engineering Reasoning
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-primary border border-sky-100 font-mono font-semibold">
              Live RAG
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs text-primary bg-sky-50/80 px-2.5 py-0.5 rounded-full border border-sky-100 font-semibold">
            <span>T+</span>
            <span>{formatTimer(seconds)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 via-primary to-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out shadow-xs"
              style={{ width: `${Math.min(98, progressPercent)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>{steps[activeStep - 1].title}</span>
            <span className="font-semibold">{Math.round(progressPercent)}%</span>
          </div>
        </div>

        {/* Stepper list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {steps.map((step) => {
            const isDone = step.id < activeStep
            const isCurrent = step.id === activeStep

            return (
              <div
                key={step.id}
                className={`p-2.5 rounded-xl border transition-all text-left flex items-start gap-2.5 ${
                  isCurrent
                    ? 'bg-sky-50/80 border-sky-300/80 shadow-2xs'
                    : isDone
                    ? 'bg-emerald-50/60 border-emerald-200/60 text-slate-700'
                    : 'bg-slate-50/50 border-slate-200/50 opacity-60 text-slate-400'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    isCurrent
                      ? 'bg-primary text-white shadow-2xs animate-pulse'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-semibold truncate ${
                      isCurrent ? 'text-primary font-bold' : isDone ? 'text-slate-800' : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight line-clamp-2 mt-0.5">
                    {isCurrent ? step.subtitle : isDone ? 'Verified in manuals' : 'Queued'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer tip */}
        <p className="text-[10px] text-slate-400 text-center italic pt-1 border-t border-slate-100">
          Reasoning over manufacturing specifications and verifying engineering tolerances...
        </p>
      </div>
    </div>
  )
}
