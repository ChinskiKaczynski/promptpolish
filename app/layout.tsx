import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import './globals.css'

const AuthListener = dynamic(() => import('@/components/auth/auth-listener').then((mod) => mod.AuthListener))

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
      <body className="min-h-screen bg-background font-sans antialiased relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-50 select-none">
          <div className="absolute top-[8%] left-[15%] w-[450px] h-[450px] rounded-full bg-indigo-200/25 blur-[120px] animate-blob-1" />
          <div className="absolute bottom-[15%] right-[15%] w-[500px] h-[500px] rounded-full bg-purple-200/20 blur-[130px] animate-blob-2" />
        </div>
        <AuthListener />
        {children}
      </body>
    </html>
  )
}

