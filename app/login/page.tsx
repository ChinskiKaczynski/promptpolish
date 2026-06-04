import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'
import { LoginForm } from '@/components/auth/login-form'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 selection:bg-indigo-100 antialiased font-sans">
      <AppHeader />
      
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <LoginForm />
      </main>

      <AppFooter />
    </div>
  )
}
