"use client"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/app/dashboard/app-sidebar"
import CartISync from "@/components/Cart/page"
import { useCustomerStore } from "@/lib/store/store.customer"
import { useCartStore } from "@/lib/store/store.cart"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ThemeProvider } from "@/components/theme/theme-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const { selectedCustomer } = useCustomerStore();
  const { productsInCart } = useCartStore();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />

        <main className="flex-1 w-full bg-gray-50 dark:dark:bg-dark-page">
          <div className="p-4 z-50 flex-1 dark:bg-dark-page border-b w-full justify-between flex items-center gap-4 sticky top-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
            <span className="font-medium text-black dark:text-dark-text-primary uppercase tracking-widest text-[14px]">
              {productsInCart.length !== 0 ? selectedCustomer?.cardName : ""}
            </span>
            <CartISync />
          </div>

          <AuthGuard>
            {children}
          </AuthGuard>
        </main>
      </SidebarProvider>
    </ThemeProvider>
  )
}