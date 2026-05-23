import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PromptPolish',
  description: 'Score, diagnose and improve prompts with a focused anonymous-first flow.'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
