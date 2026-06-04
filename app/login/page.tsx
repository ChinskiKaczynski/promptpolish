import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'
import { LoginForm } from '@/components/auth/login-form'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col pp-grid-bg text-pp-text selection:bg-pp-border-bright selection:text-white antialiased font-mono">
      <AppHeader />
      
      <main className="flex flex-1 items-center justify-center px-6 py-12 z-10 relative">
        <LoginForm />
      </main>

      <AppFooter />
    </div>
  )
}
