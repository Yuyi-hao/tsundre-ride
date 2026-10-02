import type { ChallengeStatus, SubmissionStatus } from '../types/api'

const STYLES: Record<ChallengeStatus | SubmissionStatus, string> = {
  active: 'border-green-800 text-green-400',
  expired: 'border-gray-700 text-gray-400',
  canceled: 'border-red-900 text-red-400',
  draft: 'border-gray-700 text-gray-400',
  submitted: 'border-blue-800 text-blue-400',
}

function StatusBadge({ status }: { status: ChallengeStatus | SubmissionStatus }) {
  return (
    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-xs capitalize ${STYLES[status] ?? STYLES.draft}`}>
      {status}
    </span>
  )
}

export default StatusBadge
