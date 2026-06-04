import 'server-only'
import nextDynamic from 'next/dynamic'
import { getAuthUser } from '@/lib/identity/auth'
import { verifyAdminAccess } from '@/lib/admin/auth'

const AppHeaderClient = nextDynamic(() => import('./app-header-client').then((mod) => mod.AppHeaderClient), {
  ssr: true
})

interface AppHeaderProps {
  theme?: 'light' | 'dark'
  publicShare?: boolean
}

export async function AppHeader({ theme = 'light', publicShare = false }: AppHeaderProps) {
  // If publicShare is true, strictly treat as anonymous/public-safe and skip auth checks
  if (publicShare) {
    return (
      <AppHeaderClient
        theme={theme}
        isLoggedIn={false}
        isAdmin={false}
        publicShare={true}
      />
    )
  }

  const user = await getAuthUser()
  const adminAuth = await verifyAdminAccess()
  const isAdmin = adminAuth.authorized
  const isLoggedIn = !!user

  return (
    <AppHeaderClient
      theme={theme}
      isLoggedIn={isLoggedIn}
      isAdmin={isAdmin}
      publicShare={false}
    />
  )
}
