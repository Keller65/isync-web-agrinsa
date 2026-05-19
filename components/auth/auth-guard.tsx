"use client"

import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { ShieldSlash } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import type { MenuItem } from "@/types/next-auth"

const MENU_CODE_MAP: Record<string, string> = {
  "/dashboard": "ANALYTICS",
  "/dashboard/payments": "INCOMING_PAYMENTS",
  "/dashboard/payments/new": "INCOMING_PAYMENTS",
  "/dashboard/catalog": "PRODUCT_CATALOG",
  "/dashboard/orders": "SALES_QUOTATIONS",
  "/dashboard/bulk-upload": "MASS_QUOTATIONS",
  "/dashboard/maps/history": "GPS_HISTORY",
  "/dashboard/maps/real-time": "GPS_REALTIME",
  "/dashboard/users": "USERS",
  "/dashboard/settings": "SETTINGS",
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [hasAccess, setHasAccess] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    const menus = session?.user?.menus
    const isMasterAdmin = session?.user?.isMasterAdmin ?? false

    if (isMasterAdmin) {
      setHasAccess(true)
      return
    }

    const menuCode = MENU_CODE_MAP[pathname]
    if (!menuCode) {
      setHasAccess(true)
      return
    }

    const menu = menus?.find((m: MenuItem) => m.menuCode === menuCode)
    if (menu && !menu.canView) {
      setHasAccess(false)
    } else {
      setHasAccess(true)
    }
  }, [session, status, pathname])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[92vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[92vh] p-8">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <ShieldSlash size={48} className="text-destructive" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Acceso Denegado</h2>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          No tienes permisos para acceder a esta pantalla. Contacta al administrador del sistema si necesitas acceso.
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Volver
        </Button>
      </div>
    )
  }

  return <>{children}</>
}

export function requireAuth() {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function ProtectedComponent(props: P) {
      return (
        <AuthGuard>
          <Component {...props} />
        </AuthGuard>
      )
    }
  }
}