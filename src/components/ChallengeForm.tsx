import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { ChallengeDetails, TimeUnit } from '../types/challenge'

interface ChallengeFormProps {
  // Existing details when editing, null when making a new challenge
  initial: ChallengeDetails | null
  onSave: (details: ChallengeDetails) => void
  onClose: () => void
}

const inputClass =
  'w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500'
const labelClass = 'mb-1 block text-xs font-medium text-gray-400'

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function ChallengeForm({ initial, onSave, onClose }: ChallengeFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [theme, setTheme] = useState(initial?.theme ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [duration, setDuration] = useState(initial?.duration ?? 2)
  const [durationUnit, setDurationUnit] = useState<TimeUnit>(initial?.durationUnit ?? 'hours')
  const [gracePeriod, setGracePeriod] = useState(initial?.gracePeriod ?? 10)
  const [gracePeriodUnit, setGracePeriodUnit] = useState<TimeUnit>(initial?.gracePeriodUnit ?? 'minutes')
  const [solutionVisibility, setSolutionVisibility] = useState(initial?.solutionVisibility ?? 'public')
  const [attachments, setAttachments] = useState<File[]>(initial?.attachments ?? [])

  function handleAttach(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = '' // lets the same file be picked again
    setAttachments((prev) => [...prev, ...selected])
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSave({
      name: name.trim(),
      theme: theme.trim(),
      description: description.trim(),
      duration,
      durationUnit,
      gracePeriod,
      gracePeriodUnit,
      solutionVisibility,
      attachments,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-lg border border-gray-800 bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-3">
          <h2 className="text-sm font-semibold text-white">
            {initial ? 'Edit challenge' : 'Make challenge'}
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
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Pricing page in 2 hours"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="challenge-theme" className={labelClass}>Theme</label>
            <input
              id="challenge-theme"
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              placeholder="e.g. Landing page, dark dashboard, form validation"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="challenge-duration" className={labelClass}>Duration</label>
              <div className="flex gap-2">
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

            <div>
              <label htmlFor="challenge-grace" className={labelClass}>Grace period after end</label>
              <div className="flex gap-2">
                <input
                  id="challenge-grace"
                  type="number"
                  required
                  min={0}
                  value={gracePeriod}
                  onChange={(event) => setGracePeriod(Number(event.target.value))}
                  className={inputClass}
                />
                <select
                  value={gracePeriodUnit}
                  onChange={(event) => setGracePeriodUnit(event.target.value as TimeUnit)}
                  className={inputClass}
                >
                  <option value="minutes">minutes</option>
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                </select>
              </div>
            </div>
          </div>

          <fieldset>
            <legend className={labelClass}>Solutions</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer gap-2 rounded border border-gray-700 p-3 text-sm has-[:checked]:border-blue-500">
                <input
                  type="radio"
                  name="visibility"
                  checked={solutionVisibility === 'public'}
                  onChange={() => setSolutionVisibility('public')}
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
                  checked={solutionVisibility === 'private'}
                  onChange={() => setSolutionVisibility('private')}
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
            {attachments.length > 0 && (
              <ul className="mb-2 flex flex-col gap-1">
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
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Save challenge
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChallengeForm
