import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LanguageSelectorProps {
  value: string;
  onChange: (lang: string) => void;
  className?: string;
}

const LANGUAGES = [
  { code: 'en-IN', name: 'English (India)', flag: '🇮🇳' },
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu', flag: '🇮🇳' },
  { code: 'bn-IN', name: 'Bengali', flag: '🇮🇳' },
  { code: 'mr-IN', name: 'Marathi', flag: '🇮🇳' },
  { code: 'gu-IN', name: 'Gujarati', flag: '🇮🇳' },
];

export function LanguageSelector({ value, onChange, className }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#3d3e4b] bg-[#1d1e25] text-xs font-medium text-[#EFF0D1] hover:bg-[#32333e] transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="w-3.5 h-3.5 text-[#D7C0D0]" />
        <span>{LANGUAGES.find(l => l.code === value)?.name || value}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-[#D7C0D0] transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-[#1d1e25] border border-[#3d3e4b] rounded-lg shadow-xl py-1 z-50 animate-slide-down">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                type="button"
                onClick={() => { onChange(lang.code); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors ${value === lang.code ? 'bg-[#77BA99]/20 text-[#77BA99]' : 'text-[#EFF0D1] hover:bg-[#32333e]'}`}
              >
                <span>{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
