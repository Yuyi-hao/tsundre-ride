// Shapes returned by the Django backend (backend/challenges/serializers.py)

export type ChallengeStatus = 'active' | 'canceled' | 'expired'
export type AssetFileType = 'code' | 'media'
export type SubmissionStatus = 'draft' | 'submitted'

export interface Challenge {
  id: number
  name: string
  description: string
  // Seconds
  duration: number
  slug: string
  is_public_solution: boolean
  status: ChallengeStatus
  created_at: string
  modified_at: string
}

export interface ChallengeAsset {
  id: number
  name: string
  // Path inside the project, e.g. "img/logo.png"
  path: string
  file_type: AssetFileType
  // Storage location; the bucket is private, so download through download_url instead
  asset_url: string
  // Short-lived signed URL (about an hour); null if the server couldn't sign it
  download_url: string | null
  asset_type: 'challenge' | 'solution'
  is_public: boolean
  slug: string
  created_at: string
  modified_at: string
}

export interface Submission {
  id: number
  status: SubmissionStatus
  description: string
  slug: string
  is_public: boolean
  is_editorial: boolean
  created_at: string
  modified_at: string
  assets: ChallengeAsset[]
}

export interface ChallengeDetail extends Challenge {
  owner_id: string
  assets: ChallengeAsset[]
  editorial_submission: Omit<Submission, 'is_public'> | null
}

export interface ChallengeList {
  challenges: Challenge[]
  count: number
  total_pages: number
  current_page: number
  previous_page: number | null
  next_page: number | null
}

// What the challenge form sends on create/update
export interface ChallengeInput {
  name: string
  description: string
  duration: number
  is_public_solution: boolean
}
