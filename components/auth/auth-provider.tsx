"use client"

import { SessionProvider } from "next-auth/react"

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * AuthProvider
 *
 * refetchInterval: 4 horas — correcto para tokens de larga duración.
 * Si tu token SAP expira antes, ajústalo a ese TTL (en segundos).
 *
 * Ejemplo para token de 1 hora:
 *   refetchInterval={55 * 60}  // 55 min, con margen
 *
 * refetchOnWindowFocus: true — revalida cuando el usuario vuelve a la tab.
 * Mantener en true es correcto para detectar sesiones expiradas.
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider
      refetchInterval={4 * 60 * 60}
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  )
}