import { useEffect, useRef, useState } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { ChatMessage } from '../types'

interface Props {
  wsUrl: string | null
}

export default function TerminalChat({ wsUrl }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const url = wsUrl ? wsUrl.replace(/^http/, 'ws') + '/ws/chat' : null

  const { status, send } = useWebSocket<ChatMessage>({
    url,
    onMessage: (msg) => setMessages((prev) => [...prev, msg]),
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const content = input.trim()
    if (!content) return
    send({ content })
    setMessages((prev) => [
      ...prev,
      { type: 'user_message', content, timestamp: new Date().toISOString() },
    ])
    setInput('')
  }

  const lineColor = (type: string) => {
    if (type === 'user_message') return '#58a6ff'
    if (type === 'system') return '#8b949e'
    return '#3fb950'  // agent output
  }

  const linePrefix = (type: string) =>
    type === 'user_message' ? '$ ' : type === 'system' ? '# ' : '  '

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0d1117',
        fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      }}
    >
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
        <span>Terminal</span>
        <span
          style={{
            color: status === 'open' ? '#3fb950' : status === 'error' ? '#f85149' : '#8b949e',
          }}
        >
          {status === 'error' ? 'agent disconnected' : status}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: lineColor(m.type),
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            <span style={{ opacity: 0.5 }}>{linePrefix(m.type)}</span>
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderTop: '1px solid #30363d',
          padding: '8px 12px',
          gap: 8,
        }}
      >
        <span style={{ color: '#3fb950', fontSize: 14 }}>$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Send a message..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#e6edf3',
            fontFamily: 'inherit',
            fontSize: 13,
            caretColor: '#3fb950',
          }}
        />
        <button
          onClick={handleSend}
          disabled={status !== 'open'}
          style={{
            background: '#238636',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            padding: '4px 12px',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
