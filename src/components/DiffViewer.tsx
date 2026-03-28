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

// ── Diff parser ───────────────────────────────────────────────────────────────

interface SplitRow {
  hunk?: string
  oldNo?: number
  oldLine?: string
  oldType?: 'context' | 'removed'
  newNo?: number
  newLine?: string
  newType?: 'context' | 'added'
}

function parseSplitDiff(patch: string): SplitRow[] {
  const lines = patch.split('\n')
  const rows: SplitRow[] = []
  let oldLine = 0
  let newLine = 0
  const removedBuf: { no: number; content: string }[] = []

  const flushRemoved = () => {
    for (const r of removedBuf) {
      rows.push({ oldNo: r.no, oldLine: r.content, oldType: 'removed' })
    }
    removedBuf.length = 0
  }

  for (const raw of lines) {
    if (raw.startsWith('@@')) {
      flushRemoved()
      const m = raw.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
      if (m) { oldLine = parseInt(m[1], 10); newLine = parseInt(m[2], 10) }
      rows.push({ hunk: raw })
      continue
    }
    if (raw.startsWith('---') || raw.startsWith('+++') || raw.startsWith('diff ') || raw.startsWith('index ')) continue

    if (raw.startsWith('-')) {
      removedBuf.push({ no: oldLine++, content: raw.slice(1) })
    } else if (raw.startsWith('+')) {
      if (removedBuf.length > 0) {
        const removed = removedBuf.shift()!
        rows.push({
          oldNo: removed.no, oldLine: removed.content, oldType: 'removed',
          newNo: newLine++,   newLine: raw.slice(1),    newType: 'added',
        })
      } else {
        rows.push({ newNo: newLine++, newLine: raw.slice(1), newType: 'added' })
      }
    } else {
      flushRemoved()
      const content = raw.startsWith(' ') ? raw.slice(1) : raw
      rows.push({
        oldNo: oldLine++, oldLine: content, oldType: 'context',
        newNo: newLine++, newLine: content, newType: 'context',
      })
    }
  }
  flushRemoved()
  return rows
}

// ── Colours ───────────────────────────────────────────────────────────────────

const BG: Record<string, string> = {
  removed: '#2d0f0f', added: '#0f2a1a', context: 'transparent', hunk: '#0c1929', empty: '#161b22',
}
const FG: Record<string, string> = {
  removed: '#f85149', added: '#3fb950', context: '#e6edf3', hunk: '#58a6ff', lineNo: '#484f58',
}

// ── Table cell pair ───────────────────────────────────────────────────────────

function Cell({ lineNo, content, type, isOld }: {
  lineNo?: number; content?: string; type?: 'context' | 'removed' | 'added'; isOld: boolean
}) {
  const bg  = type ? BG[type] : BG.empty
  const fg  = type === 'removed' ? FG.removed : type === 'added' ? FG.added : FG.context
  const pfx = type === 'removed' ? '-' : type === 'added' ? '+' : ' '

  return (
    <>
      <td style={{ background: bg, color: FG.lineNo, textAlign: 'right', padding: '0 8px',
        minWidth: 40, userSelect: 'none', fontSize: 11, borderRight: '1px solid #21262d' }}>
        {lineNo ?? ''}
      </td>
      <td style={{ background: bg, color: fg, padding: '0 4px', width: 16,
        userSelect: 'none', fontSize: 12,
        borderRight: isOld ? '2px solid #30363d' : undefined }}>
        {content !== undefined ? pfx : ''}
      </td>
      <td style={{ background: bg, color: fg, padding: '1px 12px 1px 4px',
        fontFamily: "'Fira Code', Consolas, monospace", fontSize: 12,
        whiteSpace: 'pre', width: '50%',
        borderRight: isOld ? '2px solid #30363d' : undefined }}>
        {content ?? ''}
      </td>
    </>
  )
}

function SplitTable({ rows }: { rows: SplitRow[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: 44 }} /><col style={{ width: 18 }} /><col />
        <col style={{ width: 44 }} /><col style={{ width: 18 }} /><col />
      </colgroup>
      <tbody>
        {rows.map((row, i) =>
          row.hunk !== undefined ? (
            <tr key={i}>
              <td colSpan={6} style={{ background: BG.hunk, color: FG.hunk,
                fontFamily: 'monospace', fontSize: 11, padding: '3px 12px' }}>
                {row.hunk}
              </td>
            </tr>
          ) : (
            <tr key={i} style={{ lineHeight: '20px' }}>
              <Cell lineNo={row.oldNo} content={row.oldLine} type={row.oldType} isOld={true} />
              <Cell lineNo={row.newNo} content={row.newLine} type={row.newType} isOld={false} />
            </tr>
          )
        )}
      </tbody>
    </table>
  )
}

// ── File stats helper ─────────────────────────────────────────────────────────

function fileStats(patch: string) {
  const lines = patch.split('\n')
  return {
    added:   lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length,
    removed: lines.filter(l => l.startsWith('-') && !l.startsWith('---')).length,
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DiffViewer({ wsUrl }: Props) {
  const [diffs, setDiffs] = useState<Record<string, FileDiff>>({})
  const [selected, setSelected] = useState<string | null>(null)

  const url = wsUrl ? wsUrl.replace(/^http/, 'ws') + '/ws/diff' : null

  useWebSocket<DiffMessage>({
    url,
    onMessage: (msg) => {
      setDiffs(prev => ({ ...prev, [msg.file]: msg }))
      setSelected(s => s ?? msg.file)
    },
  })

  const files = Object.keys(diffs)
  const current = selected ? diffs[selected] : null
  const rows = current ? parseSplitDiff(current.patch) : []

  if (files.length === 0) {
    return <div style={{ padding: 24, color: '#8b949e', fontSize: 13, textAlign: 'center' }}>No file changes yet</div>
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#0d1117' }}>

      {/* ── File sidebar ── */}
      <div style={{ width: 220, minWidth: 220, borderRight: '1px solid #30363d', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '10px 12px', fontSize: 11, color: '#8b949e', borderBottom: '1px solid #21262d' }}>
          {files.length} file{files.length !== 1 ? 's' : ''} changed
        </div>
        {files.map(f => {
          const { added, removed } = fileStats(diffs[f].patch)
          const isSelected = f === selected
          const name = f.split('/').pop()!
          const dir  = f.includes('/') ? f.substring(0, f.lastIndexOf('/')) : ''
          return (
            <div key={f} onClick={() => setSelected(f)} style={{
              padding: '8px 12px', cursor: 'pointer',
              background: isSelected ? '#161b22' : 'transparent',
              borderLeft: `2px solid ${isSelected ? '#58a6ff' : 'transparent'}`,
              borderBottom: '1px solid #21262d',
            }}>
              <div style={{ fontSize: 12, color: isSelected ? '#e6edf3' : '#8b949e', marginBottom: 2 }}>{name}</div>
              {dir && <div style={{ fontSize: 10, color: '#6e7681', marginBottom: 4, wordBreak: 'break-all' }}>{dir}</div>}
              <div style={{ display: 'flex', gap: 6 }}>
                {added   > 0 && <span style={{ color: '#3fb950', fontSize: 11, fontFamily: 'monospace' }}>+{added}</span>}
                {removed > 0 && <span style={{ color: '#f85149', fontSize: 11, fontFamily: 'monospace' }}>−{removed}</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Split diff pane ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {current && (
          <>
            {/* Sticky file header */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #30363d', fontSize: 12,
              color: '#8b949e', display: 'flex', gap: 16, position: 'sticky', top: 0,
              background: '#161b22', zIndex: 1 }}>
              <span style={{ color: '#e6edf3', fontFamily: 'monospace' }}>{selected}</span>
              <span style={{ color: '#3fb950' }}>+{fileStats(current.patch).added}</span>
              <span style={{ color: '#f85149' }}>−{fileStats(current.patch).removed}</span>
            </div>

            {/* Old / New column labels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #30363d' }}>
              {['Old', 'New'].map(label => (
                <div key={label} style={{ padding: '4px 12px', fontSize: 11, color: '#8b949e',
                  background: '#161b22', borderRight: label === 'Old' ? '2px solid #30363d' : undefined }}>
                  {label}
                </div>
              ))}
            </div>

            <SplitTable rows={rows} />
          </>
        )}
      </div>
    </div>
  )
}
