export type TimeUnit = 'minutes' | 'hours' | 'days'

export interface ChallengeDetails {
  name: string
  theme: string
  description: string
  duration: number
  durationUnit: TimeUnit
  // How long submissions are still accepted after the challenge ends
  gracePeriod: number
  gracePeriodUnit: TimeUnit
  solutionVisibility: 'public' | 'private'
  attachments: File[]
}
