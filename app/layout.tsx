import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PromptPolish — Profesjonalny Audyt i Ulepszanie Promptów',
  description: 'Darmowy, anonimowy audyt promptów 0–100. Zdiagnozuj luki, zoptymalizuj strukturę instrukcji i odbierz gotowy do skopiowania prompt o podwyższonej precyzji.',
  keywords: [
    'prompt engineering',
    'optymalizacja promptów',
    'audyt promptów',
    'prompt polish',
    'gemini',
    'prompt audit',
    'prompt optimizer',
    'sztuczna inteligencja'
  ],
  authors: [{ name: 'PromptPolish Team' }],
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title: 'PromptPolish — Profesjonalny Audyt i Ulepszanie Promptów',
    description: 'Zdiagnozuj luki i optymalizuj strukturę promptów z darmowym, anonimowym audytem 0–100.',
    url: 'https://promptpolish.com',
    siteName: 'PromptPolish',
    locale: 'pl_PL',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptPolish — Profesjonalny Audyt i Ulepszanie Promptów',
    description: 'Zdiagnozuj luki i optymalizuj strukturę promptów z darmowym, anonimowym audytem 0–100.'
  }
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
