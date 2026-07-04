export type ModelProfile = {
  slug: 'general-llm'
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
    provider: 'google',
    verificationStatus: 'unverified',
    confidenceLevel: 'medium',
    profileVersion: '1.0.0'
  }
]
