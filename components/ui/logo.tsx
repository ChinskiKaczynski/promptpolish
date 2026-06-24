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
        {/* Main P Gradient: vibrant violet/purple to indigo */}
        <linearGradient id="pGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="40%" stopColor="#A78BFA" />
          <stop offset="80%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* Glowing border highlight */}
        <linearGradient id="strokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="25%" stopColor="#C084FC" stopOpacity="0.4" />
          <stop offset="75%" stopColor="#7C3AED" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Main geometric "P" ribbon path */}
      <path
        d="M 37,25 L 25,13 L 57,13 A 18,18 0 0 1 57,49 L 43,49 A 6,6 0 0 0 37,55 L 37,75 L 25,87 L 25,55 A 18,18 0 0 1 43,37 L 57,37 A 6,6 0 0 0 57,25 L 37,25 Z"
        fill="url(#pGrad)"
        stroke="url(#strokeGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
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
      badge: 'h-7 w-7 rounded',
      icon: 'h-[16px] w-[16px]',
      text: 'text-sm'
    },
    md: {
      badge: 'h-10 w-10 rounded-xl',
      icon: 'h-[22px] w-[22px]',
      text: 'text-base'
    },
    lg: {
      badge: 'h-12 w-12 rounded-2xl',
      icon: 'h-[26px] w-[26px]',
      text: 'text-lg'
    }
  }

  const currentIcon = sizeMap[iconSize] || sizeMap.md
  const currentText = sizeMap[textSize] || sizeMap.md

  return (
    <div className={`flex items-center gap-2.5 group ${className}`}>
      {/* Premium Translucent Badge with Violet Glow */}
      <div className={`flex items-center justify-center bg-[#7C3AED]/10 border border-[#A78BFA]/20 group-hover:border-[#A78BFA]/50 transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.15)] group-hover:shadow-[0_0_24px_rgba(139,92,246,0.3)] backdrop-blur-md ${currentIcon.badge}`}>
        <LogoMark className={`${currentIcon.icon} transition-transform duration-300 group-hover:scale-105`} />
      </div>
      <span className={`font-bold tracking-tight text-[#E2E8F0] group-hover:text-white transition-colors duration-150 font-heading ${currentText.text}`}>
        Prompt<span className="text-[#A78BFA] group-hover:text-[#C084FC] transition-colors duration-150">Polish</span>
      </span>
    </div>
  )
}

