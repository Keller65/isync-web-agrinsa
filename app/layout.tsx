import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner"
import "./globals.css";
import AuthProvider from "@/components/auth/auth-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import SessionGate from "@/components/auth/SessionGate";
import { ThemeProvider } from "@/components/theme/theme-provider";

export const metadata: Metadata = {
  title: "iSync Web - Todo Sincronizado",
  description: "iSync Web es una aplicacin de tareas que se sincroniza con iSync, permitiendo gestionar tus Cotizaciones de manera eficiente y sin complicaciones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          storageKey="theme-isync"
        >
          <AuthProvider>
            <TooltipProvider>
              <SessionGate>
                <main>{children}</main>
              </SessionGate>
            </TooltipProvider>
          </AuthProvider>
          <Toaster theme="light" richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
