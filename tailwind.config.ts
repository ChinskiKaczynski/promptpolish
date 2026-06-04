import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted))',
        card: 'hsl(var(--card))',
        pp: {
          bg: 'var(--pp-bg)',
          panel: 'var(--pp-panel)',
          'panel-2': 'var(--pp-panel-2)',
          border: 'var(--pp-border)',
          'border-bright': 'var(--pp-border-bright)',
          primary: 'var(--pp-primary)',
          'primary-bright': 'var(--pp-primary-bright)',
          success: 'var(--pp-success)',
          warning: 'var(--pp-warning)',
          danger: 'var(--pp-danger)',
          text: 'var(--pp-text)',
          muted: 'var(--pp-muted)',
          cyan: 'var(--pp-cyan)'
        }
      }
    }
  },
  plugins: []
}

export default config
