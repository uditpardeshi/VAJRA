import React, { useState, useEffect } from 'react'
import { FileSearch, Cpu, CheckCircle2, ShieldCheck, Gauge } from 'lucide-react'

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
      title: 'OEM Technical Manual Lookup',
      subtitle: hasFiles
        ? `Cross-referencing ${machineId} operating manual & attached shop files...`
        : `Scanning OEM technical documentation catalog for ${machineId}...`,
      icon: <FileSearch className="w-4 h-4" />,
    },
    {
      id: 2,
      title: 'Tolerance & Pressure Isolation',
      subtitle: 'Extracting operating limits, hydraulic thresholds, and schematics...',
      icon: <Gauge className="w-4 h-4" />,
    },
    {
      id: 3,
      title: 'Engineering Constraint Verification',
      subtitle: 'Evaluating mechanical parameters against ISO/DIN tolerance envelopes...',
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      id: 4,
      title: 'Compiling Action Procedure',
      subtitle: 'Generating verified step-by-step maintenance protocol with citations...',
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
      <div className="bg-[#262730] text-[#EFF0D1] rounded-xl p-3 sm:p-3.5 shadow-md border border-[#3d3e4b] space-y-2.5">
        {/* Top bar: Status + Timer */}
        <div className="flex items-center justify-between border-b border-[#3d3e4b] pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#77BA99]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#EFF0D1]">
              Diagnostic Tolerance Verification
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#1d1e25] text-[#77BA99] border border-[#3d3e4b] font-mono font-bold">
              {machineId}
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[11px] text-[#EFF0D1] bg-[#1d1e25] px-2 py-0.5 rounded-md border border-[#3d3e4b] font-semibold">
            <span className="text-[#D7C0D0]">Elapsed:</span>
            <span>{formatTimer(seconds)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="w-full bg-[#1d1e25] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#77BA99] h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(98, progressPercent)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#D7C0D0] font-mono">
            <span className="font-semibold text-[#EFF0D1]">{steps[activeStep - 1].title}</span>
            <span className="font-bold text-[#77BA99]">{Math.round(progressPercent)}%</span>
          </div>
        </div>

        {/* Stepper list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
          {steps.map((step) => {
            const isDone = step.id < activeStep
            const isCurrent = step.id === activeStep

            return (
              <div
                key={step.id}
                className={`p-2 rounded-lg border transition-all text-left flex items-start gap-2 ${
                  isCurrent
                    ? 'bg-[#1d1e25] border-[#77BA99] text-[#EFF0D1]'
                    : isDone
                    ? 'bg-[#1d1e25] border-[#77BA99]/40 text-[#EFF0D1]'
                    : 'bg-[#1d1e25]/60 border-[#3d3e4b] text-[#D7C0D0]/60'
                }`}
              >
                <div
                  className={`p-1.5 rounded-md shrink-0 mt-0.5 ${
                    isCurrent
                      ? 'bg-[#77BA99] text-[#1d1e25] shadow-xs'
                      : isDone
                      ? 'bg-[#77BA99]/20 text-[#77BA99] border border-[#77BA99]/40'
                      : 'bg-[#262730] text-[#D7C0D0]/60'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-[#77BA99]" /> : step.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[11px] font-bold truncate ${
                      isCurrent ? 'text-[#77BA99]' : isDone ? 'text-[#EFF0D1]' : 'text-[#D7C0D0]'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[10px] text-[#D7C0D0] leading-tight line-clamp-2 mt-0.5 font-normal">
                    {isCurrent ? step.subtitle : isDone ? 'Verified against specifications' : 'Queued'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer tip */}
        <p className="text-[10px] text-[#D7C0D0]/70 text-center pt-1 border-t border-[#3d3e4b]">
          Cross-referencing machine parameters against OEM technical documentation and ISO standards.
        </p>
      </div>
    </div>
  )
}
