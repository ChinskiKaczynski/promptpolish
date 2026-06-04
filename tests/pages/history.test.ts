import { describe, expect, it, vi, beforeEach } from 'vitest'

// 1. Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

// 2. Mock next/navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn()
}))

// 3. Mock identity & queries
vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn()
}))

vi.mock('@/lib/identity/anonymous', () => ({
  getOwnerIdFromCookies: vi.fn()
}))

vi.mock('@/lib/supabase/queries', () => ({
  getPromptAnalysesForUser: vi.fn(),
  createUsageEvent: vi.fn().mockResolvedValue({})
}))

vi.mock('@/components/history/history-filters', () => ({
  HistoryFilters: vi.fn(() => null)
}))

vi.mock('@/components/history/history-client-actions', () => ({
  HistoryClientActions: vi.fn(() => null)
}))

vi.mock('@/components/auth/sign-out-button', () => ({
  SignOutButton: vi.fn(() => null)
}))

import HistoryPage from '@/app/history/page'
import { getAuthUser } from '@/lib/identity/auth'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getPromptAnalysesForUser, createUsageEvent } from '@/lib/supabase/queries'
import type { User } from '@supabase/supabase-js'
import type { PromptAnalysisRow } from '@/lib/supabase/types'

describe('HistoryPage Routing and Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Guest Conversion CTA if user is not logged in and has 0 total analyses', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null)
    vi.mocked(getOwnerIdFromCookies).mockResolvedValue('anonymous-cookie-id')
    // Mock getPromptAnalysesForUser to return empty list twice:
    // Once for the filtered results, once for total unfiltered guest check.
    vi.mocked(getPromptAnalysesForUser).mockResolvedValue([])

    const params = Promise.resolve({})
    const jsx = await HistoryPage({ searchParams: params })

    expect(jsx).toBeDefined()
    expect(createUsageEvent).toHaveBeenCalledWith(expect.objectContaining({
      event_type: 'history_viewed',
      owner_anonymous_id: 'anonymous-cookie-id'
    }))

    // Should render the header and guest CTA container
    expect(jsx.type).toBe('div')
    const mainElement = jsx.props.children[1]
    expect(mainElement.type).toBe('main')
    const ctaTitle = mainElement.props.children.props.children[2].props.children[0]
    expect(ctaTitle.props.children).toBe('Zapisuj i śledź historię swoich promptów')
  })

  it('renders History List for anonymous guest if they have at least 1 analysis', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null)
    vi.mocked(getOwnerIdFromCookies).mockResolvedValue('anonymous-cookie-id')
    
    const guestRecord = {
      id: 'analysis-123',
      input_prompt: 'My test prompt',
      working_language: 'pl',
      selected_profile_slug: 'general-llm',
      overall_score: 85,
      score_level: 'strong',
      analysis_json: {},
      improved_prompt: 'Better prompt',
      is_favorite: false,
      created_at: new Date().toISOString()
    }
    vi.mocked(getPromptAnalysesForUser).mockResolvedValue([guestRecord as unknown as PromptAnalysisRow])

    const params = Promise.resolve({})
    const jsx = await HistoryPage({ searchParams: params })

    expect(jsx).toBeDefined()
    // It should render main view containing "Historia analiz" header
    const mainElement = jsx.props.children[1]
    expect(mainElement.type).toBe('main')
    
    const titleHeader = mainElement.props.children[0].props.children[0]
    expect(titleHeader.props.children).toBe('Historia analiz')

    // Since they are anonymous, a warning/registration tip banner should render
    const guestBanner = mainElement.props.children[1]
    expect(guestBanner.props.children[0].props.children[0].props.children[1]).toBe(' Przeglądasz historię jako gość')
  })

  it('renders regular empty state if authenticated user has no analyses', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-456', email: 'user@test.com' } as unknown as User)
    vi.mocked(getOwnerIdFromCookies).mockResolvedValue('anonymous-cookie-id')
    vi.mocked(getPromptAnalysesForUser).mockResolvedValue([])

    const params = Promise.resolve({})
    const jsx = await HistoryPage({ searchParams: params })

    const mainElement = jsx.props.children[1]
    const listGrid = mainElement.props.children[3] // grid/list section
    const emptyState = listGrid.props.children
    
    expect(emptyState.props.children[1].props.children).toBe('Nie masz jeszcze zapisanych analiz')
  })
})
