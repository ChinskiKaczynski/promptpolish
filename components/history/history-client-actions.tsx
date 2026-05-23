'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface HistoryClientActionsProps {
  analysisId: string
  isFavoriteInitially: boolean
}

export function HistoryClientActions({
  analysisId,
  isFavoriteInitially
}: HistoryClientActionsProps) {
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitially)
  const [loadingFavorite, setLoadingFavorite] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)

  const toggleFavorite = async () => {
    if (loadingFavorite) return
    setLoadingFavorite(true)
    const newStatus = !isFavorite

    try {
      const response = await fetch('/api/history/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysisId,
          isFavorite: newStatus
        })
      })

      if (response.ok) {
        setIsFavorite(newStatus)
        router.refresh()
      } else {
        console.error('Failed to toggle favorite status.')
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
    } finally {
      setLoadingFavorite(false)
    }
  }

  const handleDelete = async () => {
    if (loadingDelete) return
    if (!window.confirm('Czy na pewno chcesz przenieść ten audyt do kosza? Spowoduje to również natychmiastowe zablokowanie powiązanego linku udostępniania.')) {
      return
    }

    setLoadingDelete(true)

    try {
      const response = await fetch('/api/history/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysisId
        })
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Nie udało się usunąć tego audytu.')
      }
    } catch (err) {
      console.error('Error deleting prompt audit:', err)
    } finally {
      setLoadingDelete(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Favorite Button */}
      <button
        onClick={toggleFavorite}
        disabled={loadingFavorite}
        title={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
        className={`flex h-10 w-10 items-center justify-center rounded-xl border transition active:scale-95 disabled:opacity-50 cursor-pointer ${
          isFavorite
            ? 'bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100/70'
            : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
        }`}
      >
        <svg
          className="h-5 w-5"
          fill={isFavorite ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.242.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.18 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.883c-.77-.569-.371-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z"
          />
        </svg>
      </button>

      {/* Trash/Delete Button */}
      <button
        onClick={handleDelete}
        disabled={loadingDelete}
        title="Usuń audyt"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition active:scale-95 disabled:opacity-50 cursor-pointer"
      >
        {loadingDelete ? (
          <svg className="animate-spin h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        )}
      </button>
    </div>
  )
}
