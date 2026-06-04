'use client'

import { useState } from 'react'

interface FeedbackSectionProps {
  analysisId?: string
}

export function FeedbackSection({ analysisId }: FeedbackSectionProps) {
  const [feedbackVote, setFeedbackVote] = useState<'up' | 'down' | null>(null)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  const handleFeedbackVote = async (rating: 'up' | 'down') => {
    if (!analysisId || feedbackSubmitted || feedbackLoading) return
    setFeedbackVote(rating)
    setFeedbackError(null)

    if (rating === 'up') {
      await submitFeedback(rating, null)
    }
  }

  const submitFeedback = async (rating: 'up' | 'down', comment: string | null) => {
    if (!analysisId) return
    setFeedbackLoading(true)
    setFeedbackError(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: analysisId,
          rating,
          comment: comment?.trim() || null
        })
      })
      if (!res.ok) {
        throw new Error('Nie udało się zapisać opinii. Spróbuj ponownie.')
      }
      setFeedbackSubmitted(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Błąd podczas zapisu opinii.'
      setFeedbackError(msg)
    } finally {
      setFeedbackLoading(false)
    }
  }

  const handleSubmitFeedback = () => {
    if (feedbackVote) {
      submitFeedback(feedbackVote, feedbackComment)
    }
  }

  if (!analysisId) return null

  return (
    <div className="pp-panel p-6 border-2 border-pp-border flex flex-col justify-between font-mono relative">
      <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan tracking-widest uppercase">
        {"// INTERFEJS_OPINII"}
      </div>

      <div>
        <h3 className="text-xs font-bold text-pp-text uppercase tracking-wider">Czy ten audyt był pomocny?</h3>
        <p className="mt-1 text-[11px] text-pp-muted">Twój feedback pozwala nam stale ulepszać filtry inżynierii promptów.</p>
      </div>

      <div className="mt-6 space-y-4">
        {feedbackSubmitted ? (
          <div className="border border-pp-success bg-pp-success/10 px-4 py-3 text-xs font-bold text-pp-success">
            <span>[+] OPINIA REJESTROWANA: DZIĘKUJEMY!</span>
          </div>
        ) : (
          <>
            <div className="flex gap-3" role="group" aria-label="Oceń audyt">
              <button
                id="feedback-btn-up"
                onClick={() => handleFeedbackVote('up')}
                disabled={feedbackLoading}
                aria-pressed={feedbackVote === 'up'}
                className={`pp-button flex-1 text-xs py-2.5 ${
                  feedbackVote === 'up'
                    ? 'border-pp-success bg-pp-success/10 text-pp-success'
                    : 'border-pp-border'
                }`}
              >
                <span>[👍] TAK</span>
              </button>
              <button
                id="feedback-btn-down"
                onClick={() => handleFeedbackVote('down')}
                disabled={feedbackLoading}
                aria-pressed={feedbackVote === 'down'}
                className={`pp-button flex-1 text-xs py-2.5 ${
                  feedbackVote === 'down'
                    ? 'border-pp-danger bg-pp-danger/10 text-pp-danger'
                    : 'border-pp-border'
                }`}
              >
                <span>[👎] NIE</span>
              </button>
            </div>

            {feedbackVote === 'down' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <label htmlFor="feedback-comment" className="text-[9px] font-bold uppercase tracking-wider text-pp-muted">
                  LOG // SŁABE_PUNKTY (opcjonalne, maks. 500 znaków)
                </label>
                <textarea
                  id="feedback-comment"
                  value={feedbackComment}
                  onChange={e => setFeedbackComment(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Opisz co mogło być lepsze..."
                  className="pp-textarea text-xs resize-none"
                />
                <button
                  id="feedback-submit-btn"
                  onClick={handleSubmitFeedback}
                  disabled={feedbackLoading}
                  className="pp-button pp-button-primary w-full text-xs py-2.5"
                >
                  {feedbackLoading ? 'WYSYŁANIE...' : 'WYŚLIJ LOG OPINII'}
                </button>
              </div>
            )}

            {feedbackError && (
              <p className="text-xs font-bold text-pp-danger">⚠️ {feedbackError}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
