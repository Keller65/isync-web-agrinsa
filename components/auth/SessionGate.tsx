"use client"

import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"

interface SessionGateProps {
  children: React.ReactNode
}

export default function SessionGate({ children }: SessionGateProps) {
  const { status } = useSession()
  const pathname = usePathname()
  
  const isLoginPage = pathname === "/"

  if (isLoginPage) {
    return <>{children}</>
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando sesión...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return <>{children}</>
}