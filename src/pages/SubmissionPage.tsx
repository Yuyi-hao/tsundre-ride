import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getChallenge, getSubmission, updateSubmission } from '../api/challenges'
import { errorMessage } from '../api/client'
import EditorPanel from '../components/CodeEditorPanel'
import Header from '../components/Header'
import PreviewPanel from '../components/PreviewPanel'
import StatusBadge from '../components/StatusBadge'
import type { ChallengeDetail, Submission } from '../types/api'
import type { LoadedAssets } from '../utils/assets'
import { loadAssetsAsFiles } from '../utils/assets'
import { formatDate } from '../utils/duration'
import { isOwnSubmission } from '../utils/ownership'

interface Loaded {
  key: string
  challenge?: ChallengeDetail
  submission?: Submission
  loaded?: LoadedAssets
  error?: string
}

const headerButtonClass =
  'shrink-0 rounded border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50'

// Read-only view of one submission: its notes, files and a live preview
function SubmissionPage() {
  const { slug = '', submissionSlug = '' } = useParams()
  const key = `${slug}/${submissionSlug}`
  const [result, setResult] = useState<Loaded>()
  const [activeFileName, setActiveFileName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    let ignore = false
    const loadKey = `${slug}/${submissionSlug}`
    Promise.all([getChallenge(slug), getSubmission(slug, submissionSlug)])
      .then(async ([challenge, submission]) => {
        const loaded = await loadAssetsAsFiles(submission.assets)
        if (!ignore) setResult({ key: loadKey, challenge, submission, loaded })
      })
      .catch((err) => !ignore && setResult({ key: loadKey, error: errorMessage(err) }))
    return () => {
      ignore = true
    }
  }, [slug, submissionSlug])

  const current = result?.key === key ? result : undefined

  if (!current?.challenge || !current.submission || !current.loaded) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-950">
        <Header />
        <main className="mx-auto w-full max-w-4xl px-4 py-12">
          {current?.error ? (
            <>
              <p className="text-gray-300">{current.error}</p>
              <Link to={`/challenges/${slug}`} className="mt-4 inline-block text-sm text-blue-400 hover:underline">
                ← Back to challenge
              </Link>
            </>
          ) : (
            <p className="text-sm text-gray-500">Loading submission…</p>
          )}
        </main>
      </div>
    )
  }

  const { challenge, submission, loaded } = current
  const files = loaded.files
  const isMine = isOwnSubmission(submission, challenge)
  const isDraft = submission.status === 'draft'
  const activeFile =
    files.find((file) => file.name === activeFileName) ?? files.find((file) => file.name === 'index.html') ?? files[0]

  async function update(input: Parameters<typeof updateSubmission>[2]) {
    setIsSaving(true)
    setActionError('')
    try {
      const updated = await updateSubmission(slug, submissionSlug, input)
      setResult((prev) => prev && { ...prev, submission: updated })
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    // Same layout as the coding workspace: stacked on mobile, side by side on md+
    <div className="flex min-h-screen flex-col bg-gray-950 md:h-screen md:overflow-hidden">
      <Header>
        <span className="hidden min-w-0 items-center gap-2 truncate text-sm text-gray-300 sm:flex">
          <Link to={`/challenges/${slug}`} className="truncate hover:text-white hover:underline">
            {challenge.name}
          </Link>
          <StatusBadge status={submission.status} />
        </span>
        {isMine && isDraft && challenge.status === 'active' && (
          <Link to={`/challenges/${slug}/solve?submission=${submission.slug}`} className={headerButtonClass}>
            Edit files
          </Link>
        )}
        {isMine && (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => update({ status: isDraft ? 'submitted' : 'draft' })}
            className={`shrink-0 rounded px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 ${
              isDraft ? 'bg-green-600 hover:bg-green-500' : 'border border-gray-700 hover:bg-gray-800'
            }`}
          >
            {isDraft ? 'Submit' : 'Unsubmit'}
          </button>
        )}
      </Header>

      <div className="flex shrink-0 flex-col gap-1 border-b border-gray-800 px-4 py-2 text-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <Link to={`/challenges/${slug}`} className="hover:text-gray-300">
            ← {challenge.name}
          </Link>
          <span>· {submission.is_editorial ? 'reference solution' : 'submission'}</span>
          {isMine && <span className="text-blue-400">· yours</span>}
          <span>· {submission.is_public ? 'public' : 'private'}</span>
          <span>· saved {formatDate(submission.modified_at)}</span>
          {isMine && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => update({ is_public: !submission.is_public })}
              className="rounded px-1 text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              Make {submission.is_public ? 'private' : 'public'}
            </button>
          )}
        </div>
        {submission.description && (
          <p className="line-clamp-3 whitespace-pre-wrap text-gray-300">{submission.description}</p>
        )}
        {actionError && <p className="text-xs text-red-300">{actionError}</p>}
        {loaded.skipped.length > 0 && (
          <p className="text-xs text-yellow-300">Couldn't open: {loaded.skipped.join(', ')}</p>
        )}
      </div>

      {files.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-gray-500">
          This submission has no files.
        </div>
      ) : (
        <main className="flex flex-col md:min-h-0 md:flex-1 md:flex-row">
          <EditorPanel
            files={files}
            folders={[]}
            activeFileName={activeFile?.name ?? ''}
            onSelectFile={setActiveFileName}
            readOnly
          />
          <PreviewPanel files={files} />
        </main>
      )}
    </div>
  )
}

export default SubmissionPage
