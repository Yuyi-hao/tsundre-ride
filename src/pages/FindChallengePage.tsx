import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { listChallenges } from '../api/challenges'
import { errorMessage, getAnonymousId } from '../api/client'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import type { ChallengeList, ChallengeStatus } from '../types/api'
import { formatDate, formatDuration } from '../utils/duration'

const STATUS_OPTIONS: { value: ChallengeStatus | ''; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'canceled', label: 'Canceled' },
  { value: '', label: 'All' },
]

const PER_PAGE = 12

function FindChallengePage() {
  // Filters live in the URL so they survive reloads and back/forward
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const status = (searchParams.get('status') ?? 'active') as ChallengeStatus | ''
  const onlyMine = searchParams.get('mine') === '1'
  const page = Number(searchParams.get('page')) || 1

  const [searchInput, setSearchInput] = useState(search)
  const [data, setData] = useState<ChallengeList | null>(null)
  // Which query the current data/error belongs to; anything else means a request is in flight
  const [settled, setSettled] = useState<{ key: string; error: string }>()
  const queryKey = JSON.stringify([search, status, onlyMine, page])
  const isLoading = settled?.key !== queryKey
  const error = isLoading ? '' : settled.error

  useEffect(() => {
    let ignore = false
    const key = JSON.stringify([search, status, onlyMine, page])
    listChallenges({ search, status, ownerId: onlyMine ? getAnonymousId() : undefined, page, perPage: PER_PAGE })
      .then((result) => {
        if (ignore) return
        setData(result)
        setSettled({ key, error: '' })
      })
      .catch((err) => !ignore && setSettled({ key, error: errorMessage(err) }))
    return () => {
      ignore = true
    }
  }, [search, status, onlyMine, page])

  function updateParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    // Any filter change starts again from page 1
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next)
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    updateParams({ q: searchInput.trim() || null })
  }

  const challenges = data?.challenges ?? []

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <Header>
        <Link
          to="/create"
          className="shrink-0 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
        >
          Create challenge
        </Link>
      </Header>

      <main className="mx-auto w-full max-w-4xl px-4 py-12">
        <h2 className="text-2xl font-semibold text-white">Find a challenge</h2>
        <p className="mt-2 text-gray-400">Open challenges you can join show up here.</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={handleSearch} className="flex min-w-0 flex-1 gap-2">
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name or description"
              className="min-w-0 flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="shrink-0 rounded border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex rounded border border-gray-700 text-xs">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => updateParams({ status: option.value })}
                  className={`px-2 py-1 ${
                    status === option.value ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={onlyMine}
                onChange={(event) => updateParams({ mine: event.target.checked ? '1' : null })}
              />
              Mine
            </label>
          </div>
        </div>

        {error && (
          <p className="mt-6 rounded border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</p>
        )}

        {isLoading && !data && <p className="mt-8 text-sm text-gray-500">Loading challenges…</p>}

        {!isLoading && !error && challenges.length === 0 && (
          <div className="mt-8 rounded-lg border border-dashed border-gray-800 px-4 py-12 text-center">
            <p className="text-gray-300">
              {search || onlyMine || status !== 'active' ? 'No challenges match these filters.' : 'No challenges yet.'}
            </p>
            <Link
              to="/create"
              className="mt-4 inline-block rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
            >
              Create a challenge
            </Link>
          </div>
        )}

        {challenges.length > 0 && (
          <ul className={`mt-6 grid gap-3 sm:grid-cols-2 ${isLoading ? 'opacity-60' : ''}`}>
            {challenges.map((challenge) => (
              <li key={challenge.id}>
                <Link
                  to={`/challenges/${challenge.slug}`}
                  // Old rows created before slugs existed can't be opened
                  aria-disabled={!challenge.slug}
                  onClick={(event) => !challenge.slug && event.preventDefault()}
                  className="flex h-full flex-col rounded-lg border border-gray-800 p-4 hover:border-gray-600 hover:bg-gray-900 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 truncate font-medium text-white">{challenge.name}</h3>
                    <StatusBadge status={challenge.status} />
                  </div>
                  {challenge.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-400">{challenge.description}</p>
                  )}
                  <p className="mt-auto pt-3 text-xs text-gray-500">
                    {formatDuration(challenge.duration)} · created {formatDate(challenge.created_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {data && data.total_pages > 1 && (
          <nav className="mt-6 flex items-center justify-between text-sm">
            <button
              type="button"
              disabled={!data.previous_page}
              onClick={() => updateParams({ page: String(data.previous_page) })}
              className="rounded px-3 py-1.5 text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              ← Previous
            </button>
            <span className="text-gray-500">
              Page {data.current_page} of {data.total_pages} · {data.count} challenges
            </span>
            <button
              type="button"
              disabled={!data.next_page}
              onClick={() => updateParams({ page: String(data.next_page) })}
              className="rounded px-3 py-1.5 text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Next →
            </button>
          </nav>
        )}
      </main>
    </div>
  )
}

export default FindChallengePage
