import { useState } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { DiffMessage } from '../types'

interface Props {
  wsUrl: string | null
}

interface FileDiff {
  file: string
  patch: string
  timestamp: string
}

export default function DiffViewer({ wsUrl }: Props) {
  // Keep only the latest diff per file
  const [diffs, setDiffs] = useState<Record<string, FileDiff>>({})
  const [selected, setSelected] = useState<string | null>(null)

  const url = wsUrl ? wsUrl.replace(/^http/, 'ws') + '/ws/diff' : null

  useWebSocket<DiffMessage>({
    url,
    onMessage: (msg) => {
      setDiffs((prev) => ({ ...prev, [msg.file]: msg }))
      setSelected((s) => s ?? msg.file)
    },
  })

  const files = Object.keys(diffs)
  const currentDiff = selected ? diffs[selected] : null

  if (files.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          color: '#8b949e',
          fontSize: 12,
          textAlign: 'center',
        }}
      >
        No file changes yet
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* File list */}
      <div
        style={{
          width: 180,
          borderRight: '1px solid #30363d',
          overflowY: 'auto',
          flexShrink: 0,
        }}
      >
        {files.map((f) => (
          <div
            key={f}
            onClick={() => setSelected(f)}
            style={{
              padding: '8px 12px',
              fontSize: 11,
              cursor: 'pointer',
              background: f === selected ? '#161b22' : 'transparent',
              borderLeft: f === selected ? '2px solid #58a6ff' : '2px solid transparent',
              color: f === selected ? '#e6edf3' : '#8b949e',
              wordBreak: 'break-all',
            }}
          >
            {f}
          </div>
        ))}
      </div>

      {/* Diff content */}
      <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12 }}>
        {currentDiff && <PatchView patch={currentDiff.patch} />}
      </div>
    </div>
  )
}

function PatchView({ patch }: { patch: string }) {
  const lines = patch.split('\n')

  return (
    <div>
      {lines.map((line, i) => {
        let bg = 'transparent'
        let color = '#e6edf3'

        if (line.startsWith('+++') || line.startsWith('---')) {
          color = '#8b949e'
        } else if (line.startsWith('+')) {
          bg = '#0f2a1a'
          color = '#3fb950'
        } else if (line.startsWith('-')) {
          bg = '#2d0f0f'
          color = '#f85149'
        } else if (line.startsWith('@@')) {
          color = '#58a6ff'
          bg = '#0c1929'
        } else if (line.startsWith('diff ') || line.startsWith('index ')) {
          color = '#8b949e'
        }

        return (
          <div
            key={i}
            style={{
              background: bg,
              color,
              padding: '0 12px',
              lineHeight: 1.6,
              whiteSpace: 'pre',
            }}
          >
            {line || ' '}
          </div>
        )
      })}
    </div>
  )
}
