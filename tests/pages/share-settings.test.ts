import { describe, expect, it, vi, beforeEach } from 'vitest'

// 1. Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

// 2. Mock React hooks for pure JSX inspection
vi.mock('react', async () => {
  const actual = await vi.importActual('react') as Record<string, unknown>
  return {
    ...actual,
    useState: (initial: unknown) => {
      // Mock useState to return the initial value so we can check the initial render
      return [initial, vi.fn()]
    },
    useEffect: vi.fn(),
  }
})

// Import component
import { ShareSettings } from '@/components/result/share-settings'

// Helper to find a child by type/id
function findInputByVal(node: any): any {
  if (!node) return null
  if (node.props?.id === 'share-url-input') {
    return node
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findInputByVal(item)
      if (found) return found
    }
  }
  if (typeof node === 'object' && node.props?.children) {
    return findInputByVal(node.props.children)
  }
  return null
}

describe('ShareSettings Hydration Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with an empty shareUrl initially to prevent server/client hydration mismatch', () => {
    const jsx = ShareSettings({
      analysisId: 'test-analysis-id',
      isShareEnabledInitially: true,
      shareTokenInitially: 'test-share-token-123'
    })

    expect(jsx).toBeDefined()

    const inputNode = findInputByVal(jsx)
    expect(inputNode).toBeDefined()
    // Value must be empty during initial render
    expect(inputNode.props.value).toBe('')
  })
})
