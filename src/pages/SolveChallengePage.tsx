import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { getChallenge, getSubmission } from '../api/challenges'
import { errorMessage } from '../api/client'
import Header from '../components/Header'
import type { ChallengeDetail, Submission } from '../types/api'
import type { LoadedAssets } from '../utils/assets'
import { loadAssetsAsFiles } from '../utils/assets'
import CodingWorkspace from './codingWorkspace'

interface Loaded {
  key: string
  challenge?: ChallengeDetail
  // Set when reopening a draft (?submission=<slug>)
  submission?: Submission
  loaded?: LoadedAssets
  error?: string
}

function SolveChallengePage() {
  const { slug = '' } = useParams()
  const [searchParams] = useSearchParams()
  const submissionSlug = searchParams.get('submission') ?? ''
  // Tagged with what it was loaded for, so a different URL shows as loading
  const key = `${slug}/${submissionSlug}`
  const [result, setResult] = useState<Loaded>()

  useEffect(() => {
    let ignore = false
    const loadKey = `${slug}/${submissionSlug}`
    Promise.all([getChallenge(slug), submissionSlug ? getSubmission(slug, submissionSlug) : undefined])
      .then(async ([challenge, submission]) => {
        if (submission && submission.status !== 'draft') {
          throw new Error('This submission has been submitted. Unsubmit it on the challenge page to edit it.')
        }
        const loaded = await loadAssetsAsFiles(submission ? submission.assets : challenge.assets)
        if (!ignore) setResult({ key: loadKey, challenge, submission, loaded })
      })
      .catch((err) => !ignore && setResult({ key: loadKey, error: errorMessage(err) }))
    return () => {
      ignore = true
    }
  }, [slug, submissionSlug])

  const current = result?.key === key ? result : undefined

  if (!current?.challenge || !current.loaded) {
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
            <p className="text-sm text-gray-500">Loading files…</p>
          )}
        </main>
      </div>
    )
  }

  const { challenge, submission, loaded } = current
  const notice =
    loaded.skipped.length > 0 ? `Some files couldn't be opened in the editor: ${loaded.skipped.join(', ')}` : ''

  return (
    <CodingWorkspace
      key={key}
      solving={challenge}
      startFiles={loaded.files}
      editing={submission}
      notice={notice}
    />
  )
}

export default SolveChallengePage
