import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { createChallenge, deleteAsset, getChallenge, updateChallenge, uploadAsset } from '../api/challenges'
import { errorMessage } from '../api/client'
import type { ChallengeDetail } from '../types/api'
import type { TimeUnit } from '../types/challenge'
import type { CodeFile } from '../types/file'
import { assetFileTypeFor, codeFileToBlob } from '../utils/assets'
import { fromSeconds, toSeconds } from '../utils/duration'

interface ChallengeFormProps {
  // Existing challenge when editing, null when making a new one
  initial: ChallengeDetail | null
  // Editor files that can be shared as starter files
  projectFiles?: CodeFile[]
  // Called every time the challenge is saved on the server (even if some uploads then fail)
  onSaved: (challenge: ChallengeDetail) => void
  onClose: () => void
}

interface PendingUpload {
  path: string
  getBlob: () => Promise<Blob>
  // Set for files picked in the form, so failed ones can be kept for a retry
  attachment?: File
}

const inputClass =
  'w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500'
const labelClass = 'mb-1 block text-xs font-medium text-gray-400'

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function ChallengeForm({ initial, projectFiles = [], onSaved, onClose }: ChallengeFormProps) {
  const initialDuration = initial ? fromSeconds(initial.duration) : { amount: 2, unit: 'hours' as TimeUnit }

  // Set once the challenge exists on the server, so a retry updates it instead of creating another
  const [saved, setSaved] = useState<ChallengeDetail | null>(initial)
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [duration, setDuration] = useState(initialDuration.amount)
  const [durationUnit, setDurationUnit] = useState<TimeUnit>(initialDuration.unit)
  const [isPublicSolution, setIsPublicSolution] = useState(initial?.is_public_solution ?? true)
  const [attachments, setAttachments] = useState<File[]>([])
  const [shareProjectFiles, setShareProjectFiles] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const existingAssets = saved?.assets ?? []

  function handleAttach(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = '' // lets the same file be picked again
    setAttachments((prev) => [...prev, ...selected])
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  async function removeExistingAsset(assetSlug: string) {
    if (!saved) return
    setError('')
    try {
      await deleteAsset(saved.slug, assetSlug)
      const updated = { ...saved, assets: saved.assets.filter((asset) => asset.slug !== assetSlug) }
      setSaved(updated)
      onSaved(updated)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setError('')

    const input = {
      name: name.trim(),
      description: description.trim(),
      duration: toSeconds(duration, durationUnit),
      is_public_solution: isPublicSolution,
    }

    let challenge: ChallengeDetail
    try {
      challenge = saved ? await updateChallenge(saved.slug, input) : await createChallenge(input)
    } catch (err) {
      setError(errorMessage(err))
      setIsSaving(false)
      return
    }
    setSaved(challenge)
    onSaved(challenge)

    const uploads: PendingUpload[] = [
      ...(shareProjectFiles
        ? projectFiles.map((file) => ({ path: file.name, getBlob: () => codeFileToBlob(file) }))
        : []),
      ...attachments.map((file) => ({ path: file.name, getBlob: async () => file, attachment: file })),
    ]

    const failed: string[] = []
    const failedAttachments: File[] = []
    for (const upload of uploads) {
      try {
        // Re-uploading editor files replaces the old copy instead of failing with a conflict
        const existing = challenge.assets.find((asset) => (asset.path || asset.name) === upload.path)
        if (existing && !upload.attachment) await deleteAsset(challenge.slug, existing.slug)
        await uploadAsset(challenge.slug, {
          file: await upload.getBlob(),
          path: upload.path,
          fileType: assetFileTypeFor(upload.path),
        })
      } catch (err) {
        failed.push(`${upload.path} (${errorMessage(err)})`)
        if (upload.attachment) failedAttachments.push(upload.attachment)
      }
    }

    if (uploads.length > 0) {
      // Re-fetch so the asset list matches the server
      try {
        challenge = await getChallenge(challenge.slug)
        setSaved(challenge)
        onSaved(challenge)
      } catch {
        // Not fatal: the challenge itself is saved
      }
    }

    setIsSaving(false)
    if (failed.length > 0) {
      // Keep only the attachments that didn't make it, so "Save" retries just those
      setAttachments(failedAttachments)
      setShareProjectFiles(false)
      setError(`Challenge saved, but some files failed to upload: ${failed.join(', ')}`)
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-lg border border-gray-800 bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-3">
          <h2 className="text-sm font-semibold text-white">
            {saved ? 'Edit challenge' : 'Make challenge'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded px-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <div>
            <label htmlFor="challenge-name" className={labelClass}>Challenge name</label>
            <input
              id="challenge-name"
              required
              autoFocus
              maxLength={200}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Pricing page in 2 hours"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="challenge-description" className={labelClass}>Description</label>
            <textarea
              id="challenge-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What should challengers build? Any rules?"
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <label htmlFor="challenge-duration" className={labelClass}>Duration</label>
            <div className="flex gap-2 sm:w-1/2">
              <input
                id="challenge-duration"
                type="number"
                required
                min={1}
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                className={inputClass}
              />
              <select
                value={durationUnit}
                onChange={(event) => setDurationUnit(event.target.value as TimeUnit)}
                className={inputClass}
              >
                <option value="minutes">minutes</option>
                <option value="hours">hours</option>
                <option value="days">days</option>
              </select>
            </div>
          </div>

          <fieldset>
            <legend className={labelClass}>Solutions</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer gap-2 rounded border border-gray-700 p-3 text-sm has-[:checked]:border-blue-500">
                <input
                  type="radio"
                  name="visibility"
                  checked={isPublicSolution}
                  onChange={() => setIsPublicSolution(true)}
                />
                <span>
                  <span className="block text-white">Public</span>
                  <span className="text-xs text-gray-400">Anyone can view submitted solutions</span>
                </span>
              </label>
              <label className="flex cursor-pointer gap-2 rounded border border-gray-700 p-3 text-sm has-[:checked]:border-blue-500">
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPublicSolution}
                  onChange={() => setIsPublicSolution(false)}
                />
                <span>
                  <span className="block text-white">Private</span>
                  <span className="text-xs text-gray-400">Only you can view submitted solutions</span>
                </span>
              </label>
            </div>
          </fieldset>

          <div>
            <span className={labelClass}>Attachments (optional)</span>
            {(existingAssets.length > 0 || attachments.length > 0) && (
              <ul className="mb-2 flex flex-col gap-1">
                {existingAssets.map((asset) => (
                  <li
                    key={asset.slug}
                    className="flex items-center justify-between gap-2 rounded bg-gray-950 px-3 py-1.5 text-sm"
                  >
                    <span className="truncate font-mono text-gray-300">{asset.path || asset.name}</span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-gray-500">
                      uploaded
                      <button
                        type="button"
                        onClick={() => removeExistingAsset(asset.slug)}
                        aria-label={`Delete ${asset.name}`}
                        className="rounded px-1 hover:bg-gray-800 hover:text-white"
                      >
                        ✕
                      </button>
                    </span>
                  </li>
                ))}
                {attachments.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-2 rounded bg-gray-950 px-3 py-1.5 text-sm"
                  >
                    <span className="truncate text-gray-300">{file.name}</span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-gray-500">
                      {formatSize(file.size)}
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        aria-label={`Remove ${file.name}`}
                        className="rounded px-1 hover:bg-gray-800 hover:text-white"
                      >
                        ✕
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <label className="inline-block cursor-pointer rounded border border-dashed border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-500 hover:text-white">
              + Add files (designs, images, assets…)
              <input type="file" multiple onChange={handleAttach} className="hidden" />
            </label>
          </div>

          {projectFiles.length > 0 && (
            <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={shareProjectFiles}
                onChange={(event) => setShareProjectFiles(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                Upload the {projectFiles.length} editor file(s) as starter files
                <span className="block text-xs text-gray-500">
                  Challengers start with these files open in their editor.
                </span>
              </span>
            </label>
          )}

          {error && <p className="rounded bg-red-950/50 px-3 py-2 text-xs text-red-300">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-800 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : saved ? 'Save changes' : 'Publish challenge'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChallengeForm
