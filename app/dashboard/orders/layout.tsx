"use client"

import { useSession } from "next-auth/react"
import { ShieldSlashIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data } = useSession();

  // if (!data?.user.isMasterAdmin) {
  //   return (
  //     <div className="flex-1 w-full bg-gray-50 dark:bg-dark-page">
  //       <div className="flex flex-col items-center justify-center min-h-[92vh] p-8">
  //         <div className="bg-destructive/10 p-4 rounded-full mb-4">
  //           <ShieldSlashIcon size={48} className="text-destructive" />
  //         </div>
  //         <h2 className="text-xl font-semibold text-foreground mb-2">Acceso Restringido</h2>
  //         <p className="text-muted-foreground text-center max-w-md mb-6">
  //           Los datos de recibidos solo están disponibles para usuarios no administradores. Contacta al administrador del sistema si necesitas acceso.
  //         </p>
  //         <Button variant="outline" onClick={() => window.history.back()}>
  //           Volver
  //         </Button>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="flex-1 w-full bg-gray-50">
      <div className="p-0">
        {children}
      </div>
    </div>
  )
}