import React from 'react'

interface LogoIconProps {
  className?: string
}

export function LogoIcon({ className = 'h-6 w-6' }: LogoIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>
      {/* Loop of the P */}
      <path
        d="M13 9H23C26.3137 9 29 11.6863 29 15C29 18.3137 26.3137 21 23 21H18L17.2 17.5H23C24.3807 17.5 25.5 16.3807 25.5 15C25.5 13.6193 24.3807 12.5 23 12.5H13V9Z"
        fill="url(#pGrad)"
      />
      {/* Slanted Stem of the P */}
      <path d="M18 17.5L15.3 28H11L14.7 17.5H18Z" fill="url(#pGrad)" />
      {/* Sparkle Star at (13, 17.5) */}
      <path
        d="M13 14C13 16.5 14.5 17.5 17 17.5C14.5 17.5 13 18.5 13 21C13 18.5 11.5 17.5 9 17.5C11.5 17.5 13 16.5 13 14Z"
        fill="#FFFFFF"
      />
    </svg>
  )
}
