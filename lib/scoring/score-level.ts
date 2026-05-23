export type ScoreLevel = 'weak' | 'needs_work' | 'decent' | 'strong' | 'excellent'

export function getScoreLevel(score: number): ScoreLevel {
  if (score < 40) return 'weak'
  if (score < 60) return 'needs_work'
  if (score < 75) return 'decent'
  if (score < 90) return 'strong'
  return 'excellent'
}
