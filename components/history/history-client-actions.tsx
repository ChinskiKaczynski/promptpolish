'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

  const handleOpenResult = () => {
    fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_type: 'history_result_opened',
        analysis_id: analysisId
      })
    }).catch(err => {
      console.error('Failed to log history_result_opened event:', err)
    })
  }

  return (
    <div className="flex items-center gap-2 font-mono">
      {/* Favorite Button */}
      <button
        onClick={toggleFavorite}
        disabled={loadingFavorite}
        title={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
        className={`pp-button text-xs py-1.5 px-2.5 ${
          isFavorite ? 'border-pp-warning text-pp-warning bg-pp-warning/10' : 'border-pp-border'
        }`}
      >
        <span>{isFavorite ? '★' : '☆'}</span>
      </button>

      {/* Trash/Delete Button */}
      <button
        onClick={handleDelete}
        disabled={loadingDelete}
        title="Usuń audyt"
        className="pp-button text-xs py-1.5 px-2 bg-red-950/20 border-red-800 hover:border-pp-danger hover:text-pp-danger"
      >
        {loadingDelete ? '...' : '[DEL]'}
      </button>

      {/* Open Audit Details */}
      <Link
        href={`/result/${analysisId}`}
        onClick={handleOpenResult}
        className="pp-button pp-button-primary text-xs py-1.5 px-3"
      >
        OTWÓRZ
      </Link>
    </div>
  )
}
