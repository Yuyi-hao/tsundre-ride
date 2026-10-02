import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import {
  cancelChallenge,
  deleteAsset,
  deleteSubmission,
  getChallenge,
  listSubmissions,
  updateAsset,
  updateSubmission,
} from '../api/challenges'
import { ApiError, errorMessage } from '../api/client'
import ChallengeForm from '../components/ChallengeForm'
import ChallengeTimer from '../components/ChallengeTimer'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import type { ChallengeAsset, ChallengeDetail, Submission } from '../types/api'
import { formatDate, formatDuration, getEndsAt } from '../utils/duration'
import { isChallengeOwner, isOwnSubmission } from '../utils/ownership'

const sectionTitleClass = 'text-xs font-medium uppercase tracking-wide text-gray-500'
const smallButtonClass = 'rounded px-2 py-0.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-white'

function ChallengeDetailPage() {
  const { slug = '' } = useParams()
  // "#submission-<slug>" after saving a draft: scroll to it and highlight it
  const { hash } = useLocation()
  const highlighted = hash.startsWith('#submission-') ? hash.slice('#submission-'.length) : ''
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadError, setLoadError] = useState<ApiError | Error | null>(null)
  const [actionError, setActionError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(
    () =>
      Promise.all([getChallenge(slug), listSubmissions(slug)]).then(([loadedChallenge, loadedSubmissions]) => {
        setChallenge(loadedChallenge)
        setSubmissions(loadedSubmissions)
        setLoadError(null)
      }),
    [slug]
  )

  useEffect(() => {
    load().catch((err) => setLoadError(err instanceof Error ? err : new Error(errorMessage(err))))
  }, [load])

  const isLoaded = challenge !== null
  useEffect(() => {
    if (isLoaded && highlighted) document.getElementById(`submission-${highlighted}`)?.scrollIntoView({ block: 'center' })
  }, [isLoaded, highlighted])

  // Runs an owner action and shows any error above the page content
  async function run(action: () => Promise<unknown>) {
    setActionError('')
    try {
      await action()
    } catch (err) {
      setActionError(errorMessage(err))
    }
  }

  if (loadError) {
    const notFound = loadError instanceof ApiError && loadError.status === 404
    return (
      <Page>
        <p className="text-gray-300">{notFound ? 'This challenge does not exist.' : errorMessage(loadError)}</p>
        <Link to="/challenges" className="mt-4 inline-block text-sm text-blue-400 hover:underline">
          ← Back to challenges
        </Link>
      </Page>
    )
  }

  if (!challenge) {
    return (
      <Page>
        <p className="text-sm text-gray-500">Loading challenge…</p>
      </Page>
    )
  }

  const isOwner = isChallengeOwner(challenge)
  const isActive = challenge.status === 'active'
  const endsAt = getEndsAt(challenge.created_at, challenge.duration)
  const editorial = challenge.editorial_submission
  const showEditorial = editorial && (isOwner || challenge.is_public_solution)
  // Prefer the copy from the submissions list: it is updated in place by the actions below
  const editorialItem = editorial && (submissions.find((s) => s.slug === editorial.slug) ?? { ...editorial, is_public: false })
  const otherSubmissions = submissions.filter((submission) => submission.slug !== editorial?.slug)
  const myDraft = submissions.find((s) => s.status === 'draft' && isOwnSubmission(s, challenge))

  function renderSubmission(submission: Submission) {
    return (
      <SubmissionItem
        key={submission.slug}
        challengeSlug={challenge!.slug}
        challengeIsActive={isActive}
        submission={submission}
        isMine={isOwnSubmission(submission, challenge!)}
        isHighlighted={submission.slug === highlighted}
        onUpdated={replaceSubmission}
        onDelete={() => removeSubmission(submission)}
        onError={setActionError}
      />
    )
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setActionError('Could not copy. Copy the URL from the address bar instead.')
    }
  }

  function handleCancel() {
    if (!confirm('Cancel this challenge? Challengers will no longer be able to join.')) return
    run(async () => {
      await cancelChallenge(slug)
      await load()
    })
  }

  function toggleAssetPublic(asset: ChallengeAsset) {
    run(async () => {
      const updated = await updateAsset(slug, asset.slug, { is_public: !asset.is_public })
      setChallenge((prev) => prev && { ...prev, assets: prev.assets.map((a) => (a.slug === updated.slug ? updated : a)) })
    })
  }

  function removeAsset(asset: ChallengeAsset) {
    if (!confirm(`Delete ${asset.path || asset.name}?`)) return
    run(async () => {
      await deleteAsset(slug, asset.slug)
      setChallenge((prev) => prev && { ...prev, assets: prev.assets.filter((a) => a.slug !== asset.slug) })
    })
  }

  function replaceSubmission(updated: Submission) {
    setSubmissions((prev) => prev.map((s) => (s.slug === updated.slug ? updated : s)))
  }

  function removeSubmission(submission: Submission) {
    if (!confirm('Delete this submission?')) return
    run(async () => {
      await deleteSubmission(slug, submission.slug)
      await load()
    })
  }

  return (
    <Page>
      {isEditing && (
        <ChallengeForm
          initial={challenge}
          onSaved={(saved) => setChallenge(saved)}
          onClose={() => setIsEditing(false)}
        />
      )}

      <Link to="/challenges" className="text-sm text-gray-500 hover:text-gray-300">
        ← All challenges
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="min-w-0 break-words text-2xl font-semibold text-white">{challenge.name}</h2>
            <StatusBadge status={challenge.status} />
          </div>
          <p className="mt-1 text-sm text-gray-400">
            {formatDuration(challenge.duration)} · created {formatDate(challenge.created_at)} · ends{' '}
            {formatDate(endsAt.toISOString())}
            {isActive && (
              <>
                {' '}· <ChallengeTimer createdAt={challenge.created_at} duration={challenge.duration} />
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Solutions are {challenge.is_public_solution ? 'public' : 'private to the creator'}
            {isOwner && ' · you created this challenge'}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="rounded border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          {isActive && myDraft && (
            <Link
              to={`/challenges/${challenge.slug}/solve?submission=${myDraft.slug}`}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
            >
              Continue draft
            </Link>
          )}
          {isActive && (
            <Link
              to={`/challenges/${challenge.slug}/solve`}
              className={
                myDraft
                  ? 'rounded border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white'
                  : 'rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500'
              }
            >
              {myDraft ? 'Start over' : isOwner ? 'Open editor' : 'Start challenge'}
            </Link>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Edit challenge
          </button>
          {challenge.status !== 'canceled' && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded border border-red-900 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/50"
            >
              Cancel challenge
            </button>
          )}
        </div>
      )}

      {actionError && (
        <p className="mt-4 rounded border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">{actionError}</p>
      )}

      <section className="mt-8">
        <h3 className={sectionTitleClass}>Description</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">
          {challenge.description || <span className="text-gray-500">No description.</span>}
        </p>
      </section>

      <section className="mt-8">
        <h3 className={sectionTitleClass}>Files ({challenge.assets.length})</h3>
        {challenge.assets.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No files attached.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-800 rounded border border-gray-800">
            {challenge.assets.map((asset) => (
              <li key={asset.slug} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <a
                  href={asset.download_url ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 truncate font-mono text-gray-300 hover:text-white hover:underline"
                >
                  {asset.path || asset.name}
                </a>
                <span className="flex shrink-0 items-center gap-1">
                  <span className="text-xs text-gray-500">{asset.file_type}</span>
                  {isOwner && (
                    <>
                      <button type="button" onClick={() => toggleAssetPublic(asset)} className={smallButtonClass}>
                        {asset.is_public ? 'public' : 'private'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAsset(asset)}
                        aria-label={`Delete ${asset.name}`}
                        className={smallButtonClass}
                      >
                        ✕
                      </button>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showEditorial && editorialItem && (
        <section className="mt-8">
          <h3 className={sectionTitleClass}>Reference solution</h3>
          <ul className="mt-2">{renderSubmission(editorialItem)}</ul>
        </section>
      )}

      <section className="mt-8">
        <h3 className={sectionTitleClass}>Submissions ({otherSubmissions.length})</h3>
        {otherSubmissions.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            {isOwner ? 'No submissions yet.' : 'No submissions you can see yet.'}
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {otherSubmissions.map(renderSubmission)}
          </ul>
        )}
      </section>
    </Page>
  )
}

function Page({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <Header />
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">{children}</main>
    </div>
  )
}

interface SubmissionItemProps {
  challengeSlug: string
  challengeIsActive: boolean
  submission: Submission
  isMine: boolean
  isHighlighted: boolean
  onUpdated: (submission: Submission) => void
  onDelete: () => void
  onError: (message: string) => void
}

function SubmissionItem({
  challengeSlug,
  challengeIsActive,
  submission,
  isMine,
  isHighlighted,
  onUpdated,
  onDelete,
  onError,
}: SubmissionItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(submission.description)
  const [isSaving, setIsSaving] = useState(false)

  const isDraft = submission.status === 'draft'

  async function save(input: Parameters<typeof updateSubmission>[2]) {
    setIsSaving(true)
    onError('')
    try {
      onUpdated(await updateSubmission(challengeSlug, submission.slug, input))
      setIsEditing(false)
    } catch (err) {
      onError(errorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <li
      id={`submission-${submission.slug}`}
      className={`rounded border px-3 py-2 text-sm ${isHighlighted ? 'border-blue-600' : 'border-gray-800'}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <StatusBadge status={submission.status} />
          {isMine && <span className="text-blue-400">yours</span>}
          <span>{submission.is_public ? 'public' : 'private'}</span>
          <span>· {submission.assets.length} file(s)</span>
          <span>· {formatDate(submission.modified_at)}</span>
        </div>
        {!isEditing && (
          <div className="flex flex-wrap gap-1">
            <Link to={`/challenges/${challengeSlug}/submissions/${submission.slug}`} className={smallButtonClass}>
              Open
            </Link>
            {isMine && isDraft && challengeIsActive && (
              <Link to={`/challenges/${challengeSlug}/solve?submission=${submission.slug}`} className={smallButtonClass}>
                Edit files
              </Link>
            )}
            {isMine && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => save({ status: isDraft ? 'submitted' : 'draft' })}
                className={
                  isDraft
                    ? 'rounded bg-green-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-50'
                    : smallButtonClass
                }
              >
                {isDraft ? 'Submit' : 'Unsubmit'}
              </button>
            )}
          </div>
        )}
        {isMine && !isEditing && (
          <div className="flex w-full justify-end gap-1 sm:w-auto">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => save({ is_public: !submission.is_public })}
              className={smallButtonClass}
            >
              Make {submission.is_public ? 'private' : 'public'}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(submission.description)
                setIsEditing(true)
              }}
              className={smallButtonClass}
            >
              Edit notes
            </button>
            <button type="button" onClick={onDelete} className={smallButtonClass}>
              Delete
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            save({ description: draft.trim() })
          }}
          className="mt-2"
        >
          <textarea
            rows={3}
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="w-full resize-y rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
          <div className="mt-1 flex justify-end gap-1">
            <button type="button" onClick={() => setIsEditing(false)} className={smallButtonClass}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white hover:bg-blue-500 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-1 whitespace-pre-wrap text-gray-300">
          {submission.description || <span className="text-gray-500">No notes.</span>}
        </p>
      )}
    </li>
  )
}

export default ChallengeDetailPage
