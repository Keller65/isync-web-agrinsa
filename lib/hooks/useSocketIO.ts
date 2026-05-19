'use client'

import { useEffect, useRef } from 'react'
import { useSocketIOStore } from '@/lib/store/store.socketio'

export function useSocketIO(url: string) {
  const isConnected = useSocketIOStore((state) => state.isConnected)
  const lastMessages = useSocketIOStore((state) => state.lastMessages)
  const connectRef = useRef(useSocketIOStore.getState().connect)
  const disconnectRef = useRef(useSocketIOStore.getState().disconnect)
  const hasConnected = useRef(false)

  useEffect(() => {
    if (!hasConnected.current) {
      hasConnected.current = true
      connectRef.current(url)
    }
    
    return () => {
      disconnectRef.current()
      hasConnected.current = false
    }
  }, [url])

  return { isConnected, lastMessages }
}