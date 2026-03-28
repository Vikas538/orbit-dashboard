import { useEffect, useState } from 'react'

interface Props {
  seconds: number
}

export default function TimerBadge({ seconds: initialSeconds }: Props) {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    setSeconds(initialSeconds)
  }, [initialSeconds])

  useEffect(() => {
    if (seconds <= 0) return
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1_000)
    return () => clearInterval(id)
  }, [seconds > 0])

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const label =
    h > 0
      ? `${h}h ${m.toString().padStart(2, '0')}m`
      : `${m}m ${s.toString().padStart(2, '0')}s`

  const isLow = seconds < 15 * 60  // < 15 min

  return (
    <span
      style={{
        fontSize: 11,
        color: isLow ? '#f85149' : '#8b949e',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {seconds <= 0 ? 'expired' : label + ' left'}
    </span>
  )
}
