import { useEffect, useState } from 'react'
import { formatDuration, getEndsAt } from '../utils/duration'

interface ChallengeTimerProps {
  createdAt: string
  // Seconds
  duration: number
  className?: string
}

// "1h 20m left", ticking every second, or "Time's up"
function ChallengeTimer({ createdAt, duration, className = '' }: ChallengeTimerProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const secondsLeft = Math.floor((getEndsAt(createdAt, duration).getTime() - now) / 1000)
  if (secondsLeft <= 0) return <span className={`text-red-400 ${className}`}>Time's up</span>

  const label = secondsLeft < 60 ? `${secondsLeft}s` : formatDuration(secondsLeft - (secondsLeft % 60))
  return <span className={`tabular-nums text-amber-300 ${className}`}>{label} left</span>
}

export default ChallengeTimer
