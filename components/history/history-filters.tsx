'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface HistoryFiltersProps {
  currentSearch: string
  currentLang: string
  currentProfile: string
  currentFavorite: boolean
  currentSort?: string
}

export function HistoryFilters({
  currentSearch,
  currentLang,
  currentProfile,
  currentFavorite,
  currentSort
}: HistoryFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(currentSearch)
  const [lang, setLang] = useState(currentLang)
  const [profile, setProfile] = useState(currentProfile)
  const [favorite, setFavorite] = useState(currentFavorite)
  const [sort, setSort] = useState(currentSort || 'newest')

  // Update URL search parameters when filtering values change
  const applyFilters = (updates: {
    search?: string
    lang?: string
    profile?: string
    favorite?: boolean
    sort?: string
  }) => {
    const params = new URLSearchParams(searchParams.toString())

    const newSearch = updates.search !== undefined ? updates.search : search
    const newLang = updates.lang !== undefined ? updates.lang : lang
    const newProfile = updates.profile !== undefined ? updates.profile : profile
    const newFav = updates.favorite !== undefined ? updates.favorite : favorite
    const newSort = updates.sort !== undefined ? updates.sort : sort

    if (newSearch) params.set('search', newSearch)
    else params.delete('search')

    if (newLang && newLang !== 'all') params.set('lang', newLang)
    else params.delete('lang')

    if (newProfile && newProfile !== 'all') params.set('profile', newProfile)
    else params.delete('profile')

    if (newFav) params.set('favorite', 'true')
    else params.delete('favorite')

    if (newSort && newSort !== 'newest') params.set('sort', newSort)
    else params.delete('sort')

    router.push(`/history?${params.toString()}`, { scroll: false })
  }

  // Handle search submission on enter or search button click
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters({ search })
  }

  return (
    <form onSubmit={handleSubmit} className="pp-panel p-6 border-2 border-pp-border space-y-4 font-mono relative">
      <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan tracking-widest uppercase">
        {"// FILTRY_ARCHIWUM"}
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_1fr] items-end">
        {/* Search Input */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-pp-muted" htmlFor="search-input">
            Wyszukaj słowo kluczowe
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="search-input"
              type="text"
              placeholder="Wpisz frazę..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pp-input text-xs"
            />
            <button
              type="submit"
              className="pp-button text-xs py-2 px-3 border-pp-border"
            >
              SZUKAJ
            </button>
          </div>
        </div>

        {/* Language Select */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-pp-muted" htmlFor="lang-select">
            Język roboczy
          </label>
          <select
            id="lang-select"
            value={lang}
            onChange={(e) => {
              setLang(e.target.value)
              applyFilters({ lang: e.target.value })
            }}
            className="mt-1.5 pp-select text-xs"
          >
            <option value="all">Wszystkie języki</option>
            <option value="pl">Polski (PL)</option>
            <option value="en">Angielski (EN)</option>
          </select>
        </div>

        {/* Profile Select */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-pp-muted" htmlFor="profile-select">
            Profil modelu
          </label>
          <select
            id="profile-select"
            value={profile}
            onChange={(e) => {
              setProfile(e.target.value)
              applyFilters({ profile: e.target.value })
            }}
            className="mt-1.5 pp-select text-xs"
          >
            <option value="all">Wszystkie profile</option>
            <option value="general-llm">Uniwersalny model AI</option>
            <option value="openrouter-deepseek-v4-flash">Zaawansowany model AI</option>
          </select>
        </div>

        {/* Sort Select */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-pp-muted" htmlFor="sort-select">
            Sortowanie
          </label>
          <select
            id="sort-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value)
              applyFilters({ sort: e.target.value })
            }}
            className="mt-1.5 pp-select text-xs"
          >
            <option value="newest">Najnowsze</option>
            <option value="oldest">Najstarsze</option>
            <option value="highest_score">Najwyższy wynik</option>
            <option value="lowest_score">Najniższy wynik</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-pp-border/30 pt-4 flex-wrap gap-4">
        {/* Favorites Filter */}
        <label className="inline-flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={favorite}
            onChange={(e) => {
              setFavorite(e.target.checked)
              applyFilters({ favorite: e.target.checked })
            }}
            className="h-4 w-4 border-pp-border bg-pp-panel text-pp-primary-bright focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <span className="text-xs font-semibold text-pp-text uppercase">Pokaż tylko ulubione (★)</span>
        </label>

        {/* Reset Button */}
        {(search || lang !== 'all' || profile !== 'all' || favorite || sort !== 'newest') && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setLang('all')
              setProfile('all')
              setFavorite(false)
              setSort('newest')
              router.push('/history', { scroll: false })
            }}
            className="text-[10px] font-bold text-pp-muted hover:text-pp-cyan uppercase"
          >
            [ Wyczyść filtry ]
          </button>
        )}
      </div>
    </form>
  )
}
