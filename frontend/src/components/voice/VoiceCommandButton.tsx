import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { cn } from '@/utils/cn';

interface VoiceCommandButtonProps {
  onCommand: (transcript: string, confidence: number) => void;
  disabled?: boolean;
  className?: string;
  language?: string;
  continuous?: boolean;
}

export function VoiceCommandButton({ 
  onCommand, 
  disabled, 
  className, 
  language = 'en-IN',
  continuous = false 
}: VoiceCommandButtonProps) {
  const [waveform, setWaveform] = useState<number[]>(Array(20).fill(4));
  const animationRef = useRef<number>();
  const [permissionDenied, setPermissionDenied] = useState(false);

  const { state, transcript, confidence, start, stop, abort, isSupported, isListening } = useSpeechRecognition({
    language,
    continuous,
    interimResults: true,
    onResult: (result) => {
      setWaveform(prev => [...prev.slice(1), Math.max(10, result.confidence * 100)]);
      if (result.isFinal && result.transcript.trim()) {
        onCommand(result.transcript, result.confidence);
      }
    },
    onError: (error) => {
      if (error.includes('Permission denied') || error.includes('not-allowed')) {
        setPermissionDenied(true);
      }
    },
    onStart: () => {},
    onEnd: () => {},
  });

  const animateWaveform = () => {
    animationRef.current = requestAnimationFrame(() => {
      setWaveform(prev => prev.map(() => Math.random() * 100));
      animateWaveform();
    });
  };

  useEffect(() => {
    if (state === 'listening') {
      animateWaveform();
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setWaveform(prev => prev.map(() => Math.random() * 8 + 2));
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [state]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && isSupported && state === 'idle') {
      start();
    }
  };

  const handleStop = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (state === 'listening') stop();
  };

  if (!isSupported) {
    return (
      <button disabled className={cn('px-3 py-1.5 rounded-md bg-[#1d1e25] text-gray-500 flex items-center gap-1.5 text-xs', className)}>
        <MicOff className="w-4 h-4" />
        <span className="hidden sm:inline">Speech Not Supported</span>
      </button>
    );
  }

  const isActive = state === 'listening' || state === 'processing';

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className={cn(
          'relative flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-[#77BA99]',
          disabled && 'opacity-50 cursor-not-allowed',
          isActive ? 'bg-[#D33F49]/20 text-[#D33F49] border border-[#D33F49]/60 shadow-lg animate-pulse' : 'bg-[#1d1e25] text-[#D7C0D0] hover:text-[#EFF0D1] hover:bg-[#32333e] border border-[#3d3e4b]',
          className
        )}
        onTouchStart={handleStart}
        onTouchEnd={handleStop}
        onMouseDown={handleStart}
        onMouseUp={handleStop}
        onMouseLeave={handleStop}
        onClick={() => { if (state === 'idle') start(); else if (state === 'listening') stop(); }}
        disabled={disabled}
        aria-label={isActive ? 'Release to stop listening' : 'Press and hold to speak'}
        aria-pressed={isActive}
      >
        <div className="flex items-center gap-1.5">
          {state === 'error' ? <AlertCircle className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
          <span className="font-mono">{state === 'listening' ? 'Listening...' : 'Voice Input'}</span>
        </div>
      </button>

      {/* Live Transcript Preview */}
      {transcript && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#1d1e25] border border-[#3d3e4b] text-[#EFF0D1] text-xs font-medium rounded-lg shadow-xl whitespace-nowrap max-w-xs text-center z-50 animate-fade-in">
          {transcript}
          <div className="text-[10px] text-[#77BA99] mt-0.5 font-mono">Confidence: {Math.round(confidence * 100)}%</div>
        </div>
      )}

      {/* Error Tooltip */}
      {permissionDenied && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-red-950/90 border border-red-800 text-red-200 text-[11px] rounded-lg shadow-lg whitespace-nowrap z-50">
          Microphone permission denied. Allow access in browser bar.
        </div>
      )}
    </div>
  );
}
