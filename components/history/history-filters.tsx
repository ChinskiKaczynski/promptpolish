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
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_1fr] items-end">
        {/* Search Input */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="search-input">
            Wyszukaj prompt lub tytuł
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="search-input"
              type="text"
              placeholder="Wpisz słowo kluczowe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
            />
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-4 text-sm font-semibold text-white shadow-sm transition active:scale-95 cursor-pointer"
            >
              Szukaj
            </button>
          </div>
        </div>

        {/* Language Select */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="lang-select">
            Język roboczy
          </label>
          <select
            id="lang-select"
            value={lang}
            onChange={(e) => {
              setLang(e.target.value)
              applyFilters({ lang: e.target.value })
            }}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
          >
            <option value="all">Wszystkie języki</option>
            <option value="pl">Polski (PL)</option>
            <option value="en">Angielski (EN)</option>
          </select>
        </div>

        {/* Profile Select */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="profile-select">
            Profil modelu
          </label>
          <select
            id="profile-select"
            value={profile}
            onChange={(e) => {
              setProfile(e.target.value)
              applyFilters({ profile: e.target.value })
            }}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
          >
            <option value="all">Wszystkie profile</option>
            <option value="general-llm">Uniwersalny model AI</option>
            <option value="openrouter-deepseek-v4-flash">Zaawansowany model AI</option>
          </select>
        </div>

        {/* Sort Select */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="sort-select">
            Sortowanie
          </label>
          <select
            id="sort-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value)
              applyFilters({ sort: e.target.value })
            }}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
          >
            <option value="newest">Najnowsze</option>
            <option value="oldest">Najstarsze</option>
            <option value="highest_score">Najwyższy wynik</option>
            <option value="lowest_score">Najniższy wynik</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        {/* Favorites Filter */}
        <label className="inline-flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={favorite}
            onChange={(e) => {
              setFavorite(e.target.checked)
              applyFilters({ favorite: e.target.checked })
            }}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span className="text-sm font-semibold text-slate-700">Pokaż tylko ulubione (★)</span>
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
            className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition"
          >
            Wyczyść wszystkie filtry
          </button>
        )}
      </div>
    </form>
  )
}
