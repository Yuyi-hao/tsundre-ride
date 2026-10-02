import { useState } from 'react'
import type { FormEvent } from 'react'
import { createSubmission, deleteSubmissionAsset, updateSubmission, uploadSubmissionAsset } from '../api/challenges'
import { errorMessage } from '../api/client'
import type { Submission } from '../types/api'
import type { CodeFile } from '../types/file'
import { assetFileTypeFor, codeFileToBlob } from '../utils/assets'

interface SaveDraftDialogProps {
  challengeSlug: string
  challengeName: string
  // The owner's submission is saved as the reference (editorial) solution
  isOwner: boolean
  files: CodeFile[]
  // The draft being edited; a new draft is created when missing
  existing?: Submission
  onSaved: (submission: Submission) => void
  onClose: () => void
}

function SaveDraftDialog({ challengeSlug, challengeName, isOwner, files, existing, onSaved, onClose }: SaveDraftDialogProps) {
  // Set once the draft exists, so a retry after a failed upload updates it instead of making another
  const [draft, setDraft] = useState<Submission | undefined>(existing)
  const [description, setDescription] = useState(existing?.description ?? '')
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setProgress('Saving draft…')

    let submission: Submission
    try {
      submission = draft
        ? await updateSubmission(challengeSlug, draft.slug, { description: description.trim() })
        : await createSubmission(challengeSlug, { description: description.trim() })
      setDraft(submission)
    } catch (err) {
      setError(errorMessage(err))
      setProgress('')
      return
    }

    // The draft's files are replaced with exactly what is in the editor now
    const failed: string[] = []
    try {
      for (const [index, asset] of submission.assets.entries()) {
        setProgress(`Removing old files ${index + 1}/${submission.assets.length}…`)
        await deleteSubmissionAsset(challengeSlug, submission.slug, asset.slug)
      }
    } catch (err) {
      setError(`Draft saved, but its old files couldn't be replaced: ${errorMessage(err)}`)
      setProgress('')
      return
    }
    for (const [index, file] of files.entries()) {
      setProgress(`Uploading files ${index + 1}/${files.length}…`)
      try {
        await uploadSubmissionAsset(challengeSlug, submission.slug, {
          file: await codeFileToBlob(file),
          path: file.name,
          fileType: assetFileTypeFor(file.name),
        })
      } catch (err) {
        failed.push(`${file.name} (${errorMessage(err)})`)
      }
    }

    setProgress('')
    if (failed.length > 0) {
      setError(`Draft saved, but some files failed to upload: ${failed.join(', ')}. Save again to retry.`)
      return
    }
    onSaved(submission)
  }

  const isSaving = progress !== ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-lg border border-gray-800 bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-3">
          <h2 className="truncate text-sm font-semibold text-white">
            {isOwner ? 'Save reference solution' : 'Save draft'} · {challengeName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close"
            className="rounded px-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto px-5 py-4">
          <div>
            <label htmlFor="submission-description" className="mb-1 block text-xs font-medium text-gray-400">
              Notes
            </label>
            <textarea
              id="submission-description"
              rows={5}
              autoFocus
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What did you build? Anything reviewers should know?"
              className="w-full resize-y rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>
          <p className="text-xs text-gray-500">
            Saves your {files.length} file(s) as a draft. You can submit it from the challenge page.
          </p>
          {progress && <p className="text-xs text-blue-300">{progress}</p>}
          {error && <p className="rounded bg-red-950/50 px-3 py-2 text-xs text-red-300">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-800 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save draft'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SaveDraftDialog
