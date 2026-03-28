import { useEffect, useRef, useState } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { PlanMessage } from '../types'

interface Props {
  wsUrl: string | null
}

export default function AgentPlan({ wsUrl }: Props) {
  const [messages, setMessages] = useState<PlanMessage[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  const url = wsUrl ? wsUrl.replace(/^http/, 'ws') + '/ws/plan' : null

  const { status } = useWebSocket<PlanMessage>({
    url,
    onMessage: (msg) => setMessages((prev) => [...prev, msg]),
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const msgColor = (type: string) => {
    if (type === 'heartbeat') return '#8b949e'
    if (type === 'plan') return '#58a6ff'
    return '#e6edf3'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #30363d',
          fontSize: 12,
          color: '#8b949e',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Agent Plan</span>
        <span style={{ color: status === 'open' ? '#3fb950' : '#f85149' }}>
          {status}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {messages.length === 0 && (
          <div style={{ color: '#8b949e', fontSize: 12 }}>Waiting for plan...</div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              marginBottom: 6,
              fontSize: 12,
              color: msgColor(m.type),
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
            }}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
