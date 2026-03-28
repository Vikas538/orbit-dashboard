import { useState } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { PermsMessage, PermissionRequestMessage } from '../types'

interface Props {
  wsUrl: string | null
}

export default function PermissionPanel({ wsUrl }: Props) {
  const [pending, setPending] = useState<PermissionRequestMessage[]>([])

  const url = wsUrl ? wsUrl.replace(/^http/, 'ws') + '/ws/perms' : null

  const { send } = useWebSocket<PermsMessage>({
    url,
    onMessage: (msg) => {
      if (msg.type === 'permission_request') {
        setPending((prev) => {
          // deduplicate by id
          if (prev.find((p) => p.id === msg.id)) return prev
          return [...prev, msg]
        })
      } else if (msg.type === 'permission_resolved') {
        setPending((prev) => prev.filter((p) => p.id !== msg.permission_id))
      }
    },
  })

  const respond = (permId: string, granted: boolean) => {
    send({ permission_id: permId, granted })
    setPending((prev) => prev.filter((p) => p.id !== permId))
  }

  if (pending.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          color: '#8b949e',
          fontSize: 12,
          textAlign: 'center',
        }}
      >
        No pending permission requests
      </div>
    )
  }

  return (
    <div style={{ overflowY: 'auto', maxHeight: '100%' }}>
      {pending.map((req) => (
        <div
          key={req.id}
          style={{
            margin: 12,
            padding: 16,
            background: '#2d2208',
            border: '1px solid #9e6a03',
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontWeight: 700, color: '#d29922', fontSize: 13 }}>
              Permission Required
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 10,
                color: '#8b949e',
                fontFamily: 'monospace',
              }}
            >
              {req.action}
            </span>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 2 }}>Command</div>
            <code
              style={{
                display: 'block',
                padding: '6px 10px',
                background: '#0d1117',
                borderRadius: 4,
                fontSize: 12,
                color: '#e6edf3',
                wordBreak: 'break-all',
                whiteSpace: 'pre-wrap',
              }}
            >
              {req.command}
            </code>
          </div>

          {req.reason && (
            <div style={{ marginBottom: 12, fontSize: 12, color: '#8b949e' }}>
              <span style={{ color: '#6e7681' }}>Reason: </span>
              {req.reason}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => respond(req.id, true)}
              style={{
                flex: 1,
                padding: '8px 0',
                background: '#238636',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Allow
            </button>
            <button
              onClick={() => respond(req.id, false)}
              style={{
                flex: 1,
                padding: '8px 0',
                background: '#da3633',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Deny
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
