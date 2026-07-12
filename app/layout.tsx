import type { Metadata } from 'next'
import localFont from 'next/font/local'
import dynamic from 'next/dynamic'
import './globals.css'

const spaceGrotesk = localFont({
  src: './fonts/SpaceGrotesk.woff2',
  variable: '--font-space-grotesk',
  display: 'swap',
})

const plusJakartaSans = localFont({
  src: './fonts/PlusJakartaSans.woff2',
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const jetbrainsMono = localFont({
  src: './fonts/JetBrainsMono.woff2',
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const AuthListener = dynamic(() =>
  import('@/components/auth/auth-listener').then((mod) => mod.AuthListener)
)

const productionUrl = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL 
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}` 
  : process.env.APP_URL || 'https://promptpolish.pl'

export const metadata: Metadata = {
  metadataBase: new URL(productionUrl),
  title: 'PromptPolish — Profesjonalny Audyt i Ulepszanie Promptów',
  description:
    'Darmowy, anonimowy audyt promptów 0–100. Zdiagnozuj luki, zoptymalizuj strukturę instrukcji i odbierz gotowy do skopiowania prompt o podwyższonej precyzji.',
  keywords: [
    'prompt engineering',
    'optymalizacja promptów',
    'audyt promptów',
    'prompt polish',
    'prompt audit',
    'prompt optimizer',
    'sztuczna inteligencja',
  ],
  authors: [{ name: 'PromptPolish Team' }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'PromptPolish — Profesjonalny Audyt i Ulepszanie Promptów',
    description:
      'Zdiagnozuj luki i optymalizuj strukturę promptów z darmowym, anonimowym audytem 0–100.',
    url: 'https://promptpolish.com',
    siteName: 'PromptPolish',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptPolish — Profesjonalny Audyt i Ulepszanie Promptów',
    description:
      'Zdiagnozuj luki i optymalizuj strukturę promptów z darmowym, anonimowym audytem 0–100.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pl"
      className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-50 select-none">
          <div className="absolute top-[8%] left-[15%] w-[500px] h-[500px] rounded-full bg-violet-900/20 blur-[140px] animate-blob-1" />
          <div className="absolute bottom-[15%] right-[15%] w-[550px] h-[550px] rounded-full bg-indigo-900/15 blur-[160px] animate-blob-2" />
        </div>

        <AuthListener />
        {children}
      </body>
    </html>
  )
}