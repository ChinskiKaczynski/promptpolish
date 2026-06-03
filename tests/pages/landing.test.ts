import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'

// Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: vi.fn(() => React.createElement('header', null, 'AppHeader')),
}))

vi.mock('@/components/layout/app-footer', () => ({
  AppFooter: vi.fn(() => React.createElement('footer', null, 'AppFooter')),
}))

vi.mock('@/components/layout/landing-tracker', () => ({
  LandingTracker: vi.fn(() => null),
}))

import HomePage from '@/app/page'

// Helper to extract text from React components
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

describe('Landing Page Beta Copy and Sections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders landing page with correct primary and secondary CTA text', async () => {
    const jsx = await HomePage()
    expect(jsx).toBeDefined()

    const text = extractAllText(jsx)
    expect(text).toContain('Przeprowadź audyt promptu')
    expect(text).toContain('Zobacz cennik')
  })

  it('renders landing page with problem section and use cases', async () => {
    const jsx = await HomePage()
    const text = extractAllText(jsx)

    // Problem section titles
    expect(text).toContain('Niejasny wynik')
    expect(text).toContain('Zły format wyjściowy')
    expect(text).toContain('Ryzyko halucynacji')

    // Use cases titles
    expect(text).toContain('Content & SEO')
    expect(text).toContain('Programowanie')
    expect(text).toContain('Agenty & Workflow')
  })

  it('contains the beta warning banner and does not promise PDF exports', async () => {
    const jsx = await HomePage()
    const text = extractAllText(jsx)

    expect(text).toContain('Zamknięta Beta')
    expect(text).toContain('Wszystkie funkcje są dostępne bezpłatnie')
    expect(text).not.toContain('Eksport PDF') // PDF export is not promised on landing page
  })
})
