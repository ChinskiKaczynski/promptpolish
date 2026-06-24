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
    <form onSubmit={handleSubmit} className="rounded-3xl border border-[#2A2A3A] bg-[#13131A] p-6 shadow-lg space-y-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_1fr] items-end">
        {/* Search Input */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#8290A2]" htmlFor="search-input">
            Wyszukaj prompt lub tytuł
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="search-input"
              type="text"
              placeholder="Wpisz słowo kluczowe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-[#2A2A3A] bg-[#1C1C27] px-4 py-2.5 text-sm text-[#E2E8F0] placeholder:text-[#8290A2]/60 focus:border-[#A78BFA] focus:bg-[#222230] focus:outline-none transition-all"
            />
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-2xl gradient-btn px-4 text-sm font-bold text-white shadow-sm transition active:scale-95 cursor-pointer"
            >
              Szukaj
            </button>
          </div>
        </div>

        {/* Language Select */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#8290A2]" htmlFor="lang-select">
            Język roboczy
          </label>
          <select
            id="lang-select"
            value={lang}
            onChange={(e) => {
              setLang(e.target.value)
              applyFilters({ lang: e.target.value })
            }}
            className="mt-1.5 w-full rounded-2xl border border-[#2A2A3A] bg-[#1C1C27] px-4 py-2.5 text-sm text-[#E2E8F0] focus:border-[#A78BFA] focus:bg-[#222230] focus:outline-none transition-all cursor-pointer"
          >
            <option value="all" className="bg-[#1C1C27] text-[#E2E8F0]">Wszystkie języki</option>
            <option value="pl" className="bg-[#1C1C27] text-[#E2E8F0]">Polski (PL)</option>
            <option value="en" className="bg-[#1C1C27] text-[#E2E8F0]">Angielski (EN)</option>
          </select>
        </div>

        {/* Profile Select */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#8290A2]" htmlFor="profile-select">
            Profil modelu
          </label>
          <select
            id="profile-select"
            value={profile}
            onChange={(e) => {
              setProfile(e.target.value)
              applyFilters({ profile: e.target.value })
            }}
            className="mt-1.5 w-full rounded-2xl border border-[#2A2A3A] bg-[#1C1C27] px-4 py-2.5 text-sm text-[#E2E8F0] focus:border-[#A78BFA] focus:bg-[#222230] focus:outline-none transition-all cursor-pointer"
          >
            <option value="all" className="bg-[#1C1C27] text-[#E2E8F0]">Wszystkie profile</option>
            <option value="general-llm" className="bg-[#1C1C27] text-[#E2E8F0]">Uniwersalny model AI</option>
            <option value="openrouter-deepseek-v4-flash" className="bg-[#1C1C27] text-[#E2E8F0]">Zaawansowany model AI</option>
          </select>
        </div>

        {/* Sort Select */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#8290A2]" htmlFor="sort-select">
            Sortowanie
          </label>
          <select
            id="sort-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value)
              applyFilters({ sort: e.target.value })
            }}
            className="mt-1.5 w-full rounded-2xl border border-[#2A2A3A] bg-[#1C1C27] px-4 py-2.5 text-sm text-[#E2E8F0] focus:border-[#A78BFA] focus:bg-[#222230] focus:outline-none transition-all cursor-pointer"
          >
            <option value="newest" className="bg-[#1C1C27] text-[#E2E8F0]">Najnowsze</option>
            <option value="oldest" className="bg-[#1C1C27] text-[#E2E8F0]">Najstarsze</option>
            <option value="highest_score" className="bg-[#1C1C27] text-[#E2E8F0]">Najwyższy wynik</option>
            <option value="lowest_score" className="bg-[#1C1C27] text-[#E2E8F0]">Najniższy wynik</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#2A2A3A] pt-4">
        {/* Favorites Filter */}
        <label className="inline-flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={favorite}
            onChange={(e) => {
              setFavorite(e.target.checked)
              applyFilters({ favorite: e.target.checked })
            }}
            className="h-4 w-4 rounded border-[#2A2A3A] bg-[#1C1C27] text-[#A78BFA] focus:ring-[#A78BFA] focus:ring-offset-[#13131A] cursor-pointer"
          />
          <span className="text-sm font-semibold text-[#94A3B8]">Pokaż tylko ulubione (★)</span>
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
            className="text-xs font-bold text-[#8290A2] hover:text-[#A78BFA] transition"
          >
            Wyczyść wszystkie filtry
          </button>
        )}
      </div>
    </form>
  )
}
