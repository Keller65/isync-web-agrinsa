import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'

interface LocationMessage {
  deviceId: string
  deviceName: string
  latitude: number
  longitude: number
  speed?: number
  timestamp?: string
}

interface SocketIOState {
  socket: Socket | null
  isConnected: boolean
  lastMessages: Map<string, LocationMessage>
  connect: (url: string) => void
  disconnect: () => void
}

let throttleTimeout: NodeJS.Timeout | null = null
let pendingUpdates: LocationMessage[] = []
let isConnecting = false

export const useSocketIOStore = create<SocketIOState>((set, get) => ({
  socket: null,
  isConnected: false,
  lastMessages: new Map(),

  connect: (url) => {
    if (isConnecting) return
    
    const { socket: existingSocket } = get()
    if (existingSocket?.connected) {
      return
    }

    isConnecting = true
    
    if (existingSocket) {
      existingSocket.disconnect()
    }

    const socket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
    })

    socket.on('connect', () => {
      console.log('Socket.IO conectado')
      isConnecting = false
      set({ isConnected: true, socket })
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO desconectado:', reason)
      set({ isConnected: false })
    })

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message)
      isConnecting = false
    })

    socket.on('error', (error) => {
      console.error('Socket.IO error:', error)
    })

    socket.on('location', (data: LocationMessage) => {
      pendingUpdates.push(data)

      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          if (pendingUpdates.length > 0) {
            const batch = new Map<string, LocationMessage>()
            
            for (let i = pendingUpdates.length - 1; i >= 0; i--) {
              const msg = pendingUpdates[i]
              batch.set(msg.deviceId, msg)
            }
            pendingUpdates = []
            
            set({ lastMessages: batch })
          }
          throttleTimeout = null
        }, 100)
      }
    })
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
    }
    pendingUpdates = []
    if (throttleTimeout) {
      clearTimeout(throttleTimeout)
      throttleTimeout = null
    }
    set({ socket: null, isConnected: false, lastMessages: new Map() })
  },
}))