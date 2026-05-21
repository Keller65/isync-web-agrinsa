"use client"

import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import Avvvatars from "avvvatars-react"
import { Cardholder, ChartLineUp, ShoppingCart, SignOut, Books, UsersIcon, GearSixIcon, CaretUpDownIcon, } from "@phosphor-icons/react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, SidebarGroupLabel, useSidebar, } from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import type { MenuItem } from "@/types/next-auth"

const MENU_CODE_MAP: Record<string, string> = {
  "/dashboard": "ANALYTICS",
  "/dashboard/payments": "INCOMING_PAYMENTS",
  "/dashboard/catalog": "PRODUCT_CATALOG",
  "/dashboard/orders": "SALES_QUOTATIONS",
  "/dashboard/maps/history": "GPS_HISTORY",
  "/dashboard/maps/real-time": "GPS_REALTIME",
  "/dashboard/users": "USERS",
  "/dashboard/settings": "SETTINGS",
}

const items = [
  {
    title: "Principal",
    items: [
      {
        title: "Analíticas",
        url: "/dashboard",
        icon: ChartLineUp,
      },
      {
        title: "Pago Recibido",
        url: "/dashboard/payments",
        icon: Cardholder,
      },
      {
        title: "Catálogo",
        url: "/dashboard/catalog",
        icon: Books,
      },
    ],
  },
  {
    title: "Cotizaciones",
    items: [
      {
        title: "Cotizaciones",
        url: "/dashboard/orders",
        icon: ShoppingCart,
      },
    ],
  },
  {
    title: "Utilidades",
    items: [
      {
        title: "Usuarios",
        url: "/dashboard/users",
        icon: UsersIcon,
      },
    ],
  },
  {
    title: "Cuenta",
    items: [
      {
        title: "Ajustes",
        url: "/dashboard/settings",
        icon: GearSixIcon,
      },
    ],
  },
]

function canViewMenu(url: string, menus: MenuItem[] | undefined, isMasterAdmin: boolean): boolean {
  // Master admin ve todo
  if (isMasterAdmin) return true

  if (!menus || menus.length === 0) return false
  const menuCode = MENU_CODE_MAP[url]

  // Si la ruta no existe en el mapa de permisos, ocultar
  if (!menuCode) return false

  const menu = menus.find((m) => m.menuCode === menuCode)

  return menu?.canView === true
}

export function AppSidebar() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { setOpenMobile, isMobile } = useSidebar()

  const menus = session?.user?.menus
  const isMasterAdmin = session?.user?.isMasterAdmin ?? false

  // Mientras carga sesión, evitar renderizar items incorrectos
  const filteredItems =
    status === "loading"
      ? []
      : items
        .map((group) => ({
          ...group,
          items:
            group.items?.filter((item) =>
              canViewMenu(item.url, menus, isMasterAdmin)
            ) ?? [],
        }))
        .filter((group) => group.items.length > 0)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push(window.location.origin)
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-brand-primary">
                <Image
                  alt="logo isync"
                  src="/assets/iSync.png"
                  height={24}
                  width={24}
                  priority
                />
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  iSync Web
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Agrinsa
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {filteredItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>
              {group.title}
            </SidebarGroupLabel>

            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                  >
                    <Link
                      href={item.url}
                      onClick={() =>
                        isMobile && setOpenMobile(false)
                      }
                    >
                      <item.icon size={20} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avvvatars
                    value={session?.user?.email ?? ""}
                    style="shape"
                    size={32}
                  />

                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {session?.user?.fullName}
                    </span>

                    <span className="truncate text-xs text-muted-foreground">
                      {session?.user?.isMasterAdmin == null
                        ? "Cargando..."
                        : session.user.isMasterAdmin
                          ? "Usuario Administrador"
                          : "Vendedor iSync"}
                    </span>
                  </div>

                  <CaretUpDownIcon
                    size={16}
                    className="ml-auto"
                  />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
              >
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive"
                >
                  <SignOut size={16} className="mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}