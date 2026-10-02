import { rememberOwnSubmission, request } from './client'
import type {
  AssetFileType,
  ChallengeAsset,
  ChallengeDetail,
  ChallengeInput,
  ChallengeList,
  ChallengeStatus,
  Submission,
  SubmissionStatus,
} from '../types/api'

// Challenges

export interface ListChallengesParams {
  search?: string
  status?: ChallengeStatus | ''
  // Only challenges created by this anonymous ID
  ownerId?: string
  page?: number
  perPage?: number
}

export function listChallenges({ search, status, ownerId, page = 1, perPage = 10 }: ListChallengesParams = {}) {
  return request<ChallengeList>('challenges/', {
    query: { search, status, owner_id: ownerId, page, per_page_items: perPage },
  })
}

export async function createChallenge(input: ChallengeInput) {
  const content = await request<{ challenge: ChallengeDetail }>('challenges/', { method: 'POST', body: input })
  return content.challenge
}

export function getChallenge(slug: string) {
  return request<ChallengeDetail>(`challenges/${slug}/`)
}

export function updateChallenge(slug: string, input: Partial<ChallengeInput>) {
  return request<ChallengeDetail>(`challenges/${slug}/`, { method: 'PATCH', body: input })
}

// The backend doesn't delete: it marks the challenge as canceled
export function cancelChallenge(slug: string) {
  return request<object>(`challenges/${slug}/`, { method: 'DELETE' })
}

// Assets

export async function listAssets(challengeSlug: string) {
  const content = await request<{ assets: ChallengeAsset[] }>(`challenges/${challengeSlug}/assets/`)
  return content.assets
}

export interface UploadAssetInput {
  file: Blob
  // Path inside the project, e.g. "img/logo.png"
  path: string
  fileType: AssetFileType
  isPublic?: boolean
}

export function uploadAsset(challengeSlug: string, { file, path, fileType, isPublic = true }: UploadAssetInput) {
  const form = new FormData()
  form.append('file', file, path.slice(path.lastIndexOf('/') + 1))
  form.append('path', path)
  form.append('file_type', fileType)
  form.append('is_public', String(isPublic))
  return request<ChallengeAsset>(`challenges/${challengeSlug}/assets/`, { method: 'POST', body: form })
}

export function updateAsset(challengeSlug: string, assetSlug: string, input: { name?: string; is_public?: boolean }) {
  return request<ChallengeAsset>(`challenges/${challengeSlug}/assets/${assetSlug}/`, { method: 'PATCH', body: input })
}

export function deleteAsset(challengeSlug: string, assetSlug: string) {
  return request<undefined>(`challenges/${challengeSlug}/assets/${assetSlug}/`, { method: 'DELETE' })
}

// Submissions

// Owner sees every submission; everyone else sees their own plus public ones
export async function listSubmissions(challengeSlug: string) {
  const content = await request<{ submissions: Submission[] }>(`challenges/${challengeSlug}/submissions/`)
  return content.submissions
}

// A submission by the challenge owner becomes the editorial (reference) solution
export async function createSubmission(challengeSlug: string, input: { description: string }) {
  const submission = await request<Submission>(`challenges/${challengeSlug}/submissions/`, {
    method: 'POST',
    body: input,
  })
  rememberOwnSubmission(submission.slug)
  return submission
}

export function getSubmission(challengeSlug: string, submissionSlug: string) {
  return request<Submission>(`challenges/${challengeSlug}/submissions/${submissionSlug}/`)
}

export function updateSubmission(
  challengeSlug: string,
  submissionSlug: string,
  input: { description?: string; is_public?: boolean; status?: SubmissionStatus },
) {
  return request<Submission>(`challenges/${challengeSlug}/submissions/${submissionSlug}/`, {
    method: 'PATCH',
    body: input,
  })
}

export function deleteSubmission(challengeSlug: string, submissionSlug: string) {
  return request<undefined>(`challenges/${challengeSlug}/submissions/${submissionSlug}/`, { method: 'DELETE' })
}


// Submission files (the solution code). Only editable while the submission is a draft.

export async function listSubmissionAssets(challengeSlug: string, submissionSlug: string) {
  const content = await request<{ assets: ChallengeAsset[] }>(
    `challenges/${challengeSlug}/submissions/${submissionSlug}/assets/`,
  )
  return content.assets
}

export function uploadSubmissionAsset(
  challengeSlug: string,
  submissionSlug: string,
  { file, path, fileType }: Omit<UploadAssetInput, 'isPublic'>,
) {
  const form = new FormData()
  form.append('file', file, path.slice(path.lastIndexOf('/') + 1))
  form.append('path', path)
  form.append('file_type', fileType)
  return request<ChallengeAsset>(`challenges/${challengeSlug}/submissions/${submissionSlug}/assets/`, {
    method: 'POST',
    body: form,
  })
}

export function deleteSubmissionAsset(challengeSlug: string, submissionSlug: string, assetSlug: string) {
  return request<undefined>(`challenges/${challengeSlug}/submissions/${submissionSlug}/assets/${assetSlug}/`, {
    method: 'DELETE',
  })
}
