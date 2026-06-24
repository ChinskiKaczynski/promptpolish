import React from 'react'

interface LogoMarkProps {
  className?: string
}

export function LogoMark({ className = 'h-6 w-6' }: LogoMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Tall P Gradient: pink-purple to deep violet */}
        <linearGradient id="tallPGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E9D5FF" />
          <stop offset="40%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        {/* Lower P Gradient: violet to indigo */}
        <linearGradient id="lowerPGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* Sparkle/Star Gradient: white to cyan */}
        <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Curly Braces Gradient: soft glow */}
        <linearGradient id="braceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#818CF8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Left Curly Brace */}
      <path
        d="M 28,26 C 24,26 23,30 23,38 L 23,45 C 23,48 22,49 20,50 C 22,51 23,52 23,55 L 23,62 C 23,70 24,74 28,74"
        stroke="url(#braceGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right Curly Brace */}
      <path
        d="M 72,26 C 76,26 77,30 77,38 L 77,45 C 77,48 78,49 80,50 C 78,51 77,52 77,55 L 77,62 C 77,70 76,74 72,74"
        stroke="url(#braceGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Sparkle Star at Top Right of Right Brace */}
      <path
        d="M 74,17 C 74,21 75,23 79,23 C 75,23 74,25 74,29 C 74,25 73,23 69,23 C 73,23 74,21 74,17 Z"
        fill="url(#sparkleGrad)"
      />

      {/* Tall P (Background) */}
      <path
        d="M 34,28 L 48,28 A 10,10 0 0 1 58,38 L 58,40 A 10,10 0 0 1 48,50 L 40,50 L 40,60 L 34,60 Z M 40,34 L 40,44 L 48,44 A 4,4 0 0 0 52,40 L 52,38 A 4,4 0 0 0 48,34 Z"
        fill="url(#tallPGrad)"
        fillRule="evenodd"
      />

      {/* Lower P (Foreground) */}
      <path
        d="M 42,42 L 56,42 A 10,10 0 0 1 66,52 L 66,54 A 10,10 0 0 1 56,64 L 48,64 L 48,74 L 42,74 Z M 48,48 L 48,58 L 56,58 A 4,4 0 0 0 60,54 L 60,52 A 4,4 0 0 0 56,48 Z"
        fill="url(#lowerPGrad)"
        fillRule="evenodd"
      />
    </svg>
  )
}

// Backwards compatibility wrapper for LogoIcon
export function LogoIcon({ className = 'h-6 w-6' }: LogoMarkProps) {
  return <LogoMark className={className} />
}

interface LogoProps {
  className?: string
  iconSize?: 'sm' | 'md' | 'lg'
  textSize?: 'sm' | 'md' | 'lg'
}

export function Logo({ className = '', iconSize = 'md', textSize = 'md' }: LogoProps) {
  const sizeMap = {
    sm: {
      container: 'rounded-xl px-2.5 py-1 bg-violet-500/5 border border-violet-500/10 hover:bg-violet-500/10 hover:border-violet-500/20 transition-all duration-200 gap-2',
      badge: 'h-8 w-8 rounded-lg bg-[#7C3AED]/10 border border-[#A78BFA]/20 shadow-[0_0_12px_rgba(139,92,246,0.15)]',
      icon: 'h-[18px] w-[18px]',
      text: 'text-sm font-semibold tracking-[-0.01em] text-slate-200'
    },
    md: {
      container: 'rounded-2xl px-3 py-1.5 bg-slate-950/70 border border-violet-400/25 shadow-[0_0_28px_rgba(139,92,246,0.22)] transition-all duration-300 hover:bg-violet-500/12 hover:border-violet-400/40 hover:shadow-[0_0_32px_rgba(139,92,246,0.35)] backdrop-blur-md gap-3',
      badge: 'h-[46px] w-[46px] rounded-xl bg-violet-500/15 border border-violet-400/35 shadow-[0_0_22px_rgba(139,92,246,0.30)]',
      icon: 'h-[26px] w-[26px]',
      text: 'text-[17px] font-bold tracking-[-0.02em] text-slate-100'
    },
    lg: {
      container: 'rounded-2xl px-4 py-2 bg-slate-950/70 border border-violet-400/30 shadow-[0_0_32px_rgba(139,92,246,0.25)] transition-all duration-300 hover:bg-violet-500/15 hover:border-violet-400/45 hover:shadow-[0_0_36px_rgba(139,92,246,0.4)] backdrop-blur-md gap-3.5',
      badge: 'h-12 w-12 rounded-2xl bg-violet-500/15 border border-violet-400/40 shadow-[0_0_28px_rgba(139,92,246,0.35)]',
      icon: 'h-[28px] w-[28px]',
      text: 'text-lg font-bold tracking-[-0.02em] text-white'
    }
  }

  const currentIcon = sizeMap[iconSize] || sizeMap.md
  const currentText = sizeMap[textSize] || sizeMap.md

  return (
    <div className={`flex items-center group transition-all duration-300 ${currentIcon.container} ${className}`}>
      {/* Premium Translucent Badge with Violet Glow */}
      <div className={`flex items-center justify-center transition-all duration-300 ${currentIcon.badge}`}>
        <LogoMark className={`${currentIcon.icon} transition-transform duration-300 group-hover:scale-105`} />
      </div>
      <span className={`tracking-tight group-hover:text-white transition-colors duration-150 font-heading ${currentText.text}`}>
        Prompt<span className="text-[#A78BFA] group-hover:text-[#C084FC] transition-colors duration-150">Polish</span>
      </span>
    </div>
  )
}


