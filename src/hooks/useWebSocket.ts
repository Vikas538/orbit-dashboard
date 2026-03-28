import { useEffect, useRef, useState, useCallback } from 'react'

export type WSStatus = 'connecting' | 'open' | 'closed' | 'error'

interface Options<T> {
  url: string | null
  onMessage: (msg: T) => void
  maxRetries?: number
}

export function useWebSocket<T>({ url, onMessage, maxRetries = 5 }: Options<T>) {
  const [status, setStatus] = useState<WSStatus>('closed')
  const ws = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const onMessageRef = useRef(onMessage)
  const unmountedRef = useRef(false)

  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    if (!url || unmountedRef.current) return

    setStatus('connecting')
    const socket = new WebSocket(url)
    ws.current = socket

    socket.onopen = () => {
      if (unmountedRef.current) return socket.close()
      retriesRef.current = 0
      setStatus('open')
    }

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as T
        onMessageRef.current(msg)
      } catch {
        // ignore malformed frames
      }
    }

    socket.onclose = () => {
      if (unmountedRef.current) return
      setStatus('closed')
      if (retriesRef.current < maxRetries) {
        const delay = Math.min(1000 * 2 ** retriesRef.current, 30_000)
        retriesRef.current++
        setTimeout(connect, delay)
      } else {
        setStatus('error')
      }
    }

    socket.onerror = () => {
      socket.close()
    }
  }, [url, maxRetries])

  useEffect(() => {
    unmountedRef.current = false
    if (url) {
      retriesRef.current = 0
      connect()
    }
    return () => {
      unmountedRef.current = true
      ws.current?.close()
    }
  }, [url, connect])

  const send = useCallback((data: unknown) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data))
    }
  }, [])

  return { status, send }
}
