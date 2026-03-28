import { useEffect, useState } from 'react'
import { SessionDetail as SessionDetailType } from '../types'
import TimerBadge from './TimerBadge'
import AgentPlan from './AgentPlan'
import TerminalChat from './TerminalChat'
import PermissionPanel from './PermissionPanel'
import DiffViewer from './DiffViewer'

interface Props {
  sessionId: string
}

type Tab = 'terminal' | 'plan' | 'diff' | 'perms'

const TAB_LABELS: { key: Tab; label: string }[] = [
  { key: 'terminal', label: 'Terminal' },
  { key: 'plan',     label: 'Plan' },
  { key: 'diff',     label: 'Diffs' },
  { key: 'perms',    label: 'Permissions' },
]

const STATUS_COLOR: Record<string, string> = {
  IN_PROGRESS:    '#3fb950',
  PLANNING_DONE:  '#58a6ff',
  PENDING:        '#d29922',
  COMPLETED:      '#8b949e',
  SNAPSHOT_SAVED: '#8b949e',
  BLOCKED:        '#f85149',
}

export default function SessionDetail({ sessionId }: Props) {
  const [detail, setDetail] = useState<SessionDetailType | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('terminal')
  const [disconnected, setDisconnected] = useState(false)
  const [unseenPerms, setUnseenPerms] = useState(0)

  useEffect(() => {
    setDetail(null)
    setDisconnected(false)
    setUnseenPerms(0)

    const load = () =>
      fetch(`/sessions/${sessionId}`)
        .then((r) => r.json())
        .then(setDetail)
        .catch(() => setDisconnected(true))

    load()
    const id = setInterval(load, 15_000)
    return () => clearInterval(id)
  }, [sessionId])

  if (!detail) {
    return (
      <div style={{ flex: 1, padding: 24, color: '#8b949e', fontSize: 13 }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid #30363d',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15 }}>{detail.ticket_id}</span>
        <span
          style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 10,
            background: STATUS_COLOR[detail.status] ?? '#8b949e',
            color: '#0d1117',
            fontWeight: 700,
          }}
        >
          {detail.status}
        </span>
        <span style={{ fontSize: 12, color: '#8b949e' }}>
          {detail.repo_name} · {detail.model_used}
        </span>
        <TimerBadge seconds={detail.time_remaining} />

        {disconnected && (
          <span
            style={{
              marginLeft: 'auto',
              background: '#da3633',
              color: '#fff',
              fontSize: 11,
              padding: '2px 10px',
              borderRadius: 4,
            }}
          >
            agent disconnected
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #30363d',
          flexShrink: 0,
        }}
      >
        {TAB_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key)
              if (key === 'perms') setUnseenPerms(0)
            }}
            style={{
              padding: '8px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === key ? '2px solid #58a6ff' : '2px solid transparent',
              color: activeTab === key ? '#e6edf3' : '#8b949e',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeTab === key ? 600 : 400,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {label}
            {key === 'perms' && unseenPerms > 0 && activeTab !== 'perms' && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#d29922',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Panel — all tabs stay mounted to preserve WebSocket state */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: activeTab === 'terminal' ? 'flex' : 'none', height: '100%', flexDirection: 'column' }}>
          <TerminalChat wsUrl={detail.ws_url} />
        </div>
        <div style={{ display: activeTab === 'plan' ? 'flex' : 'none', height: '100%', flexDirection: 'column' }}>
          <AgentPlan wsUrl={detail.ws_url} />
        </div>
        <div style={{ display: activeTab === 'diff' ? 'flex' : 'none', height: '100%', flexDirection: 'column' }}>
          <DiffViewer wsUrl={detail.ws_url} />
        </div>
        <div style={{ display: activeTab === 'perms' ? 'block' : 'none', height: '100%' }}>
          <PermissionPanel
            wsUrl={detail.ws_url}
            onNewPermission={() => {
              if (activeTab !== 'perms') setUnseenPerms((n) => n + 1)
            }}
          />
        </div>
      </div>
    </div>
  )
}
