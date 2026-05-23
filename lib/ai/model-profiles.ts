export type ModelProfile = {
  slug: 'general-llm' | 'google-gemini-3-5-flash'
  displayName: string
  provider: string
  verificationStatus: 'verified' | 'unverified' | 'stale'
  confidenceLevel: 'high' | 'medium' | 'low'
  sourceUrl?: string
  sourceCheckedAt?: string
  profileVersion: string
}

export const mvpModelProfiles: ModelProfile[] = [
  {
    slug: 'general-llm',
    displayName: 'General LLM',
    provider: 'generic',
    verificationStatus: 'unverified',
    confidenceLevel: 'medium',
    profileVersion: '1.0.0'
  },
  {
    slug: 'google-gemini-3-5-flash',
    displayName: 'Gemini 3.5 Flash profile',
    provider: 'google',
    verificationStatus: 'unverified',
    confidenceLevel: 'low',
    profileVersion: '1.0.0'
  }
]
