import { describe, expect, it, vi, beforeEach } from 'vitest'

// 1. Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

// 2. Mock React hooks for pure JSX inspection
vi.mock('react', async () => {
  const actual = await vi.importActual('react') as Record<string, unknown>
  return {
    ...actual,
    useState: (initial: unknown) => [initial, vi.fn()],
    useEffect: vi.fn(),
  }
})

// 3. Mock next/navigation dependencies
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  })
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabaseClient: {
    auth: {
      signOut: vi.fn(),
    }
  }
}))

// Import components
import { AppHeaderClient } from '@/components/layout/app-header-client'

// Helper to safely extract all text content from a JSX element tree without circular refs
function extractAllText(node: unknown): string {
  if (!node) return ''
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map((n: unknown) => extractAllText(n)).join(' ')
  }
  if (typeof node === 'object' && node !== null && 'props' in node) {
    const obj = node as { props: { children?: unknown; label?: unknown; title?: unknown; placeholder?: unknown } }
    const parts = [
      extractAllText(obj.props.children),
      obj.props.label ? String(obj.props.label) : '',
      obj.props.title ? String(obj.props.title) : '',
      obj.props.placeholder ? String(obj.props.placeholder) : ''
    ]
    return parts.filter(Boolean).join(' ')
  }
  return ''
}

describe('Global Navigation System - AppHeaderClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logged-out header shows Login and not Logout/Account', () => {
    const jsx = AppHeaderClient({
      theme: 'light',
      isLoggedIn: false,
      isAdmin: false,
      publicShare: false
    })

    expect(jsx).toBeDefined()
    
    const text = extractAllText(jsx)
    expect(text).toContain('Zaloguj')
    expect(text).not.toContain('Wyloguj')
    expect(text).not.toContain('Konto')
  })

  it('logged-in header shows Account and Logout, but not Login', () => {
    const jsx = AppHeaderClient({
      theme: 'light',
      isLoggedIn: true,
      isAdmin: false,
      publicShare: false
    })

    expect(jsx).toBeDefined()
    
    const text = extractAllText(jsx)
    expect(text).toContain('Konto')
    expect(text).toContain('Wyloguj')
    expect(text).not.toContain('Zaloguj')
  })

  it('admin user sees Admin Metrics link', () => {
    const jsx = AppHeaderClient({
      theme: 'light',
      isLoggedIn: true,
      isAdmin: true,
      publicShare: false
    })

    expect(jsx).toBeDefined()
    
    const text = extractAllText(jsx)
    expect(text).toContain('Admin')
  })

  it('non-admin user does not see Admin Metrics link', () => {
    const jsx = AppHeaderClient({
      theme: 'light',
      isLoggedIn: true,
      isAdmin: false,
      publicShare: false
    })

    expect(jsx).toBeDefined()
    
    const text = extractAllText(jsx)
    expect(text).not.toContain('Admin')
  })

  it('public share page strictly restricts account-private links and admin info', () => {
    const jsx = AppHeaderClient({
      theme: 'light',
      isLoggedIn: true,
      isAdmin: true,
      publicShare: true
    })

    expect(jsx).toBeDefined()
    
    const text = extractAllText(jsx)
    expect(text).toContain('Strona główna')
    expect(text).toContain('Przeanalizuj prompt')
    expect(text).not.toContain('Konto')
    expect(text).not.toContain('Wyloguj')
    expect(text).not.toContain('Admin')
    expect(text).not.toContain('Zaloguj')
  })
})
