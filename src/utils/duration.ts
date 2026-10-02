import type { TimeUnit } from '../types/challenge'

const SECONDS_PER_UNIT: Record<TimeUnit, number> = {
  minutes: 60,
  hours: 60 * 60,
  days: 24 * 60 * 60,
}

export function toSeconds(amount: number, unit: TimeUnit) {
  return Math.round(amount * SECONDS_PER_UNIT[unit])
}

// Picks the largest unit that divides evenly: 7200 -> { amount: 2, unit: 'hours' }
export function fromSeconds(seconds: number): { amount: number; unit: TimeUnit } {
  for (const unit of ['days', 'hours'] as const) {
    if (seconds % SECONDS_PER_UNIT[unit] === 0) return { amount: seconds / SECONDS_PER_UNIT[unit], unit }
  }
  return { amount: Math.max(1, Math.round(seconds / 60)), unit: 'minutes' }
}

// 5400 -> "1h 30m"
export function formatDuration(seconds: number) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const parts = [days && `${days}d`, hours && `${hours}h`, minutes && `${minutes}m`].filter(Boolean)
  return parts.length ? parts.join(' ') : `${seconds}s`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

// The backend has no start time, so a challenge is treated as running from creation for `duration` seconds
export function getEndsAt(createdAt: string, durationSeconds: number) {
  return new Date(new Date(createdAt).getTime() + durationSeconds * 1000)
}
