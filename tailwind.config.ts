import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border:     'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted:      'hsl(var(--muted))',
        card:       'hsl(var(--card))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        // Named palette for direct use
        'pp-base':     '#0C0C10',
        'pp-surface':  '#13131A',
        'pp-elevated': '#1C1C27',
        'pp-border':   '#2A2A3A',
        'pp-violet':   '#A78BFA',
        'pp-emerald':  '#6EE7B7',
        'pp-amber':    '#F59E0B',
        'pp-text':     '#E2E8F0',
        'pp-muted':    '#94A3B8',
        'pp-dim':      '#4A5568',
      },
      fontFamily: {
        sans:    ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
      fontSize: {
        'xs':   ['0.8125rem', { lineHeight: '1.5' }],  // 13px — absolute minimum
        'sm':   ['0.875rem',  { lineHeight: '1.6' }],  // 14px
        'base': ['0.9375rem', { lineHeight: '1.65' }], // 15px
        'lg':   ['1.0625rem', { lineHeight: '1.6' }],  // 17px
        'xl':   ['1.1875rem', { lineHeight: '1.5' }],  // 19px
        '2xl':  ['1.5rem',    { lineHeight: '1.35' }],
        '3xl':  ['1.875rem',  { lineHeight: '1.25' }],
        '4xl':  ['2.25rem',   { lineHeight: '1.15' }],
        '5xl':  ['3rem',      { lineHeight: '1.1' }],
        '6xl':  ['3.75rem',   { lineHeight: '1.05' }],
      },
      boxShadow: {
        'violet-glow': '0 0 40px -8px rgba(167, 139, 250, 0.2)',
        'score-glow':  '0 0 32px -8px rgba(245, 158, 11, 0.3)',
        'surface':     '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(42,42,58,1)',
      },
      borderColor: {
        DEFAULT: '#2A2A3A',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'score':      'scoreReveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'blob-1':     'float-blob-1 20s infinite ease-in-out',
        'blob-2':     'float-blob-2 26s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}

export default config
