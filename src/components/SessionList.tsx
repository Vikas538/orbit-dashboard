import { useEffect, useState } from 'react'
import { Session } from '../types'
import TimerBadge from './TimerBadge'

interface Props {
  selectedId: string | null
  onSelect: (id: string) => void
}

const STATUS_COLOR: Record<string, string> = {
  IN_PROGRESS:    '#3fb950',
  PLANNING_DONE:  '#58a6ff',
  PENDING:        '#d29922',
  COMPLETED:      '#8b949e',
  SNAPSHOT_SAVED: '#8b949e',
  BLOCKED:        '#f85149',
}

export default function SessionList({ selectedId, onSelect }: Props) {
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    const load = () =>
      fetch('/sessions')
        .then((r) => r.json())
        .then(setSessions)
        .catch(() => {})

    load()
    const id = setInterval(load, 10_000)
    return () => clearInterval(id)
  }, [])

  if (sessions.length === 0) {
    return (
      <div style={{ padding: 20, color: '#8b949e', fontSize: 13 }}>
        No active sessions
      </div>
    )
  }

  return (
    <div>
      {sessions.map((s) => {
        const isSelected = s.session_id === selectedId
        return (
          <div
            key={s.session_id}
            onClick={() => onSelect(s.session_id)}
            style={{
              padding: '12px 20px',
              cursor: 'pointer',
              borderBottom: '1px solid #21262d',
              background: isSelected ? '#161b22' : 'transparent',
              borderLeft: isSelected ? '3px solid #58a6ff' : '3px solid transparent',
              transition: 'background 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{s.ticket_id}</span>
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 10,
                  background: STATUS_COLOR[s.status] ?? '#8b949e',
                  color: '#0d1117',
                  fontWeight: 700,
                }}
              >
                {s.status}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 4 }}>
              {s.repo_name ?? '—'} · {s.model_used ?? '—'}
            </div>
            <TimerBadge seconds={s.time_remaining} />
          </div>
        )
      })}
    </div>
  )
}
