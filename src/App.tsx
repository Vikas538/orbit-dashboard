import { useState } from 'react'
import SessionList from './components/SessionList'
import SessionDetail from './components/SessionDetail'

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: '#0d1117',
    color: '#e6edf3',
  },
  sidebar: {
    width: 320,
    minWidth: 320,
    borderRight: '1px solid #30363d',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #30363d',
    fontSize: 18,
    fontWeight: 700,
    color: '#58a6ff',
    letterSpacing: 1,
  },
  main: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#8b949e',
    fontSize: 14,
  },
}

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.header}>OrbIT</div>
        <SessionList selectedId={selectedId} onSelect={setSelectedId} />
      </aside>
      <main style={styles.main}>
        {selectedId ? (
          <SessionDetail sessionId={selectedId} />
        ) : (
          <div style={styles.empty}>Select a session to monitor</div>
        )}
      </main>
    </div>
  )
}
