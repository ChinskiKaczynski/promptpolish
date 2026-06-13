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
        'pp-base':     '#0C0C10',
        'pp-surface':  '#13131A',
        'pp-elevated': '#1C1C27',
        'pp-border':   '#2A2A3A',
        'pp-violet':   '#A78BFA',
        'pp-emerald':  '#6EE7B7',
        'pp-amber':    '#F59E0B',
        'pp-text':     '#E2E8F0',
        'pp-muted':    '#94A3B8',
        'pp-dim':      '#8290A2',
      },
      fontFamily: {
        sans:    ['var(--font-plus-jakarta)', '-apple-system', 'sans-serif'],
        heading: ['var(--font-space-grotesk)', 'sans-serif'],
        mono:    ['var(--font-jetbrains-mono)', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
