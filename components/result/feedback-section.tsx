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
    <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-slate-900">Czy ten audyt był pomocny?</h3>
        <p className="mt-1 text-xs text-slate-500">Twój feedback pozwala nam stale ulepszać filtry inżynierii promptów.</p>
      </div>

      <div className="mt-6 space-y-3">
        {feedbackSubmitted ? (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-xs font-bold text-emerald-700">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Dziękujemy za przesłanie opinii!</span>
          </div>
        ) : (
          <>
            <div className="flex gap-3" role="group" aria-label="Oceń audyt">
              <button
                id="feedback-btn-up"
                onClick={() => handleFeedbackVote('up')}
                disabled={feedbackLoading}
                aria-pressed={feedbackVote === 'up'}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-xs font-semibold transition-all active:scale-95 disabled:opacity-60 cursor-pointer ${
                  feedbackVote === 'up'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className="text-base">👍</span>
                <span>Tak, bardzo</span>
              </button>
              <button
                id="feedback-btn-down"
                onClick={() => handleFeedbackVote('down')}
                disabled={feedbackLoading}
                aria-pressed={feedbackVote === 'down'}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-xs font-semibold transition-all active:scale-95 disabled:opacity-60 cursor-pointer ${
                  feedbackVote === 'down'
                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className="text-base">👎</span>
                <span>Nie, słaba jakość</span>
              </button>
            </div>

            {feedbackVote === 'down' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <label htmlFor="feedback-comment" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Co poszło nie tak? (opcjonalne, maks. 500 znaków)
                </label>
                <textarea
                  id="feedback-comment"
                  value={feedbackComment}
                  onChange={e => setFeedbackComment(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Opisz co mogło być lepsze..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none transition-colors"
                />
                <button
                  id="feedback-submit-btn"
                  onClick={handleSubmitFeedback}
                  disabled={feedbackLoading}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 transition-all cursor-pointer"
                >
                  {feedbackLoading ? 'Wysyłanie...' : 'Wyślij opinię'}
                </button>
              </div>
            )}

            {feedbackError && (
              <p className="text-xs font-medium text-rose-600">⚠️ {feedbackError}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
