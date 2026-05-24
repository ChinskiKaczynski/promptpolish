export type ModelProfile = {
  slug: 'general-llm' | 'openrouter-deepseek-v4-flash'
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
    slug: 'openrouter-deepseek-v4-flash',
    displayName: 'DeepSeek v4 Flash Profile',
    provider: 'openrouter',
    verificationStatus: 'unverified',
    confidenceLevel: 'low',
    profileVersion: '1.0.0'
  }
]
