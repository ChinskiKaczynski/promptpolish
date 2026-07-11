import { describe, expect, it, vi, beforeEach } from 'vitest'

// 1. Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

// Keep track of the mocked return values dynamically
let mockOriginValue = ''
const mockSetState = vi.fn()

// 2. Mock React hooks for pure JSX inspection
vi.mock('react', async () => {
  const actual = await vi.importActual('react') as Record<string, unknown>
  return {
    ...actual,
    useState: (initial: unknown) => {
      // Return initial state and a mock setter that we can inspect
      return [initial, mockSetState]
    },
    useEffect: vi.fn(),
    useSyncExternalStore: (subscribe: () => void, getSnapshot: () => string, getServerSnapshot: () => string) => {
      // Mock useSyncExternalStore using our dynamic variable
      return mockOriginValue === '' ? getServerSnapshot() : mockOriginValue
    }
  }
})

// Import component
import { ShareSettings } from '@/components/result/share-settings'

// Helper to find a child by type/id or other criteria
interface MockNode {
  type?: unknown
  props?: {
    id?: string
    role?: string
    children?: MockNode | MockNode[]
    value?: string
    onClick?: (...args: unknown[]) => unknown
  }
}

function findInputByVal(node: MockNode | MockNode[] | null | undefined): MockNode | null {
  if (!node) return null
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findInputByVal(item)
      if (found) return found
    }
    return null
  }
  if (node.props?.id === 'share-url-input') {
    return node
  }
  if (typeof node === 'object' && node.props?.children) {
    return findInputByVal(node.props.children)
  }
  return null
}

function findButtonByRoleOrText(node: MockNode | MockNode[] | null | undefined, attr: { role?: string; text?: string }): MockNode | null {
  if (!node) return null
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findButtonByRoleOrText(item, attr)
      if (found) return found
    }
    return null
  }
  if (attr.role && node.props?.role === attr.role) {
    return node
  }
  if (attr.text && typeof node.props?.children === 'string' && node.props.children.includes(attr.text)) {
    return node
  }
  if (typeof node === 'object' && node.props?.children) {
    return findButtonByRoleOrText(node.props.children, attr)
  }
  return null
}

describe('ShareSettings Component & Hydration Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOriginValue = ''
    mockSetState.mockReset()
  })

  it('renders with an empty shareUrl during SSR to prevent hydration mismatch', () => {
    mockOriginValue = '' // Simulates SSR environment

    const jsx = ShareSettings({
      analysisId: 'test-analysis-id',
      isShareEnabledInitially: true,
      shareTokenInitially: 'test-share-token-123'
    })

    expect(jsx).toBeDefined()

    const inputNode = findInputByVal(jsx as MockNode)
    expect(inputNode).toBeDefined()
    expect(inputNode?.props?.value).toBe('')
  })

  it('renders with a complete shareUrl on the client after mounting', () => {
    mockOriginValue = 'http://localhost:3000' // Simulates client environment

    const jsx = ShareSettings({
      analysisId: 'test-analysis-id',
      isShareEnabledInitially: true,
      shareTokenInitially: 'test-share-token-123'
    })

    expect(jsx).toBeDefined()

    const inputNode = findInputByVal(jsx as MockNode)
    expect(inputNode).toBeDefined()
    expect(inputNode?.props?.value).toBe('http://localhost:3000/share/test-share-token-123')
  })

  it('copies the share link to clipboard when the copy button is clicked', async () => {
    mockOriginValue = 'https://promptpolish.com'
    const writeTextSpy = vi.fn().mockResolvedValue(undefined)
    
    // Mock navigator.clipboard safely
    if (global.navigator) {
      Object.defineProperty(global.navigator, 'clipboard', {
        value: {
          writeText: writeTextSpy
        },
        configurable: true,
        writable: true
      })
    } else {
      Object.defineProperty(global, 'navigator', {
        value: {
          clipboard: {
            writeText: writeTextSpy
          }
        },
        configurable: true,
        writable: true
      })
    }

    const jsx = ShareSettings({
      analysisId: 'test-analysis-id',
      isShareEnabledInitially: true,
      shareTokenInitially: 'token-abc'
    })

    const copyBtn = findButtonByRoleOrText(jsx as MockNode, { text: 'Kopiuj' })
    expect(copyBtn).toBeDefined()
    expect(copyBtn?.props?.onClick).toBeDefined()

    // Execute click
    await copyBtn!.props!.onClick!()

    expect(writeTextSpy).toHaveBeenCalledWith('https://promptpolish.com/share/token-abc')
  })

  it('triggers api fetch to toggle share setting when the toggle switch is clicked', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ share_token: 'new-token-789' })
    })
    global.fetch = fetchSpy

    const jsx = ShareSettings({
      analysisId: 'analysis-456',
      isShareEnabledInitially: false,
      shareTokenInitially: null
    })

    const toggleBtn = findButtonByRoleOrText(jsx as MockNode, { role: 'switch' })
    expect(toggleBtn).toBeDefined()
    expect(toggleBtn?.props?.onClick).toBeDefined()

    // Click toggle to enable share
    await toggleBtn!.props!.onClick!()

    expect(fetchSpy).toHaveBeenCalledWith('/api/share', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ analysis_id: 'analysis-456' })
    }))
  })
})
