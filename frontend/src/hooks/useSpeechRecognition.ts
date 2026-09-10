import { useState, useRef, useEffect, useCallback } from 'react';

export type SpeechRecognitionState = 'idle' | 'listening' | 'processing' | 'error';

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface UseSpeechRecognitionOptions {
  language?: string;           // e.g., 'en-IN', 'hi-IN', 'ta-IN'
  continuous?: boolean;        // Keep listening after result
  interimResults?: boolean;    // Get partial results
  maxAlternatives?: number;    // Number of alternatives
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition({
  language = 'en-IN',          // Indian English - much better for factory accents
  continuous = true,           // Keep listening
  interimResults = true,       // Get partial results
  maxAlternatives = 1,
  onResult,
  onError,
  onEnd,
  onStart,
}: UseSpeechRecognitionOptions = {}) {
  const [state, setState] = useState<SpeechRecognitionState>('idle');
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const restartTimeoutRef = useRef<any>();

  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window === 'undefined' || (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window))) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // ---- CRITICAL SETTINGS FOR FACTORY ENVIRONMENT ----
    recognition.continuous = continuous;        // Keep listening after result
    recognition.interimResults = interimResults; // Get partial results in real-time
    recognition.lang = language;                 // 'en-IN' for Indian English accents
    recognition.maxAlternatives = maxAlternatives;
    
    // Noise handling (Chrome only)
    try {
      recognition.noiseSuppression = true;
      recognition.audioGainControl = true;
    } catch (e) {}

    recognition.onstart = () => {
      isListeningRef.current = true;
      setState('listening');
      onStart?.();
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alt = result[0];
        const text = alt.transcript;
        const conf = alt.confidence || 0;
        maxConfidence = Math.max(maxConfidence, conf);

        if (result.isFinal) {
          finalTranscript += text + ' ';
        } else {
          interimTranscript += text + ' ';
        }
      }

      const currentTranscript = (finalTranscript || interimTranscript).trim();
      const isFinal = !!finalTranscript.trim();

      setTranscript(currentTranscript);
      setConfidence(maxConfidence);

      if (currentTranscript) {
        onResult?.({
          transcript: currentTranscript,
          confidence: maxConfidence,
          isFinal,
        });
      }
    };

    recognition.onerror = (event: any) => {
      // Ignore 'no-speech' and 'aborted' - not real errors
      const ignoredErrors = ['no-speech', 'aborted', 'audio-capture'];
      if (ignoredErrors.includes(event.error)) {
        if (continuous && isListeningRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            try { recognition.start(); } catch (e) {}
          }, 300);
        }
        return;
      }

      const errorMsg = 
        event.error === 'audio-capture' ? 'Microphone access denied' :
        event.error === 'not-allowed' ? 'Permission denied. Allow microphone in browser settings.' :
        event.error === 'network' ? 'Network error. Check connection.' :
        event.error === 'service-not-allowed' ? 'Speech service blocked.' :
        `Recognition error: ${event.error}`;
      
      onError?.(errorMsg);
      setState('error');
      isListeningRef.current = false;
    };

    recognition.onend = () => {
      if (continuous && isListeningRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          try { recognition.start(); } catch (e) {}
        }, 300);
      } else {
        isListeningRef.current = false;
        setState('idle');
        onEnd?.();
      }
    };

    recognitionRef.current = recognition;

    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {});
    }

    return () => {
      clearTimeout(restartTimeoutRef.current);
      try { recognition.stop(); } catch (e) {}
      recognitionRef.current = null;
    };
  }, [language, continuous, interimResults, maxAlternatives, onResult, onError, onEnd]);

  const start = useCallback(() => {
    if (recognitionRef.current && !isListeningRef.current) {
      isListeningRef.current = true;
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already started
      }
    }
  }, []);

  const stop = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, []);

  const abort = useCallback(() => {
    isListeningRef.current = false;
    clearTimeout(restartTimeoutRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      setState('idle');
    }
  }, []);

  const isSupported = typeof window !== 'undefined' && (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);

  return { 
    state, 
    transcript, 
    confidence, 
    start, 
    stop, 
    abort, 
    isSupported,
    isListening: state === 'listening',
  };
}
