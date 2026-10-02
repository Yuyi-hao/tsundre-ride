import { getAnonymousId, isRememberedOwnSubmission } from '../api/client'
import type { ChallengeDetail, Submission } from '../types/api'

export function isChallengeOwner(challenge: ChallengeDetail) {
  return challenge.owner_id === getAnonymousId()
}

// Submissions come back without owner_id, so this is worked out from what each viewer is allowed to see.
export function isOwnSubmission(submission: Pick<Submission, 'slug' | 'is_editorial' | 'is_public'>, challenge: ChallengeDetail) {
  if (isRememberedOwnSubmission(submission.slug)) return true
  if (isChallengeOwner(challenge)) return submission.is_editorial
  // Non-owners only get back their own submissions plus public ones
  return !submission.is_public
}
