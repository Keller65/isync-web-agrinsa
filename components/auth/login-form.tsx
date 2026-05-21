"use client"

import { signIn, useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "../ui/input"

/**
 * LoginForm
 *
 * Cambios respecto al original:
 * - Eliminado el setTimeout(100) — era un workaround del race condition.
 * - Usamos redirect: false + router.replace (no push) para evitar que
 *   el usuario pueda volver al login con el botón Atrás.
 * - SessionSync se encarga de poblar el store; el form no toca Zustand.
 * - El error de next-auth viene en result.error (string) no en un objeto
 *   axios, así que el catch ahora maneja correctamente ambos casos.
 */
export default function LoginForm() {
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isPending, setIsPending] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { data: session, status, update } = useSession()

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (session.user.requiresTwoFactorSetup) {
        router.replace("/auth/2fa-setup")
      } else {
        router.replace("/auth/2fa")
      }
    }
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setIsPending(true)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username,
        password,
        appType: "WEB",
      })

      if (!result || result.error) {
        setErrorMessage("Credenciales inválidas.")
        return
      }

      // Force session update to include qrCodeBase64 and manualKey from API response
      await update()
    } catch {
      setErrorMessage("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="w-full mx-auto">
      <div className="mb-8 hidden md:block">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Inicia sesión
        </h2>
        <p className="text-sm text-gray-500">Accede a tu cuenta iSync</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            className="block text-sm font-semibold text-gray-700 mb-2"
            htmlFor="username"
          >
            Código de Empleado
          </label>
          <Input
            className="w-full h-13 px-4 py-3 border dark:text-black border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all bg-gray-50 hover:bg-white"
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ej: 123456"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              className="block text-sm font-semibold text-gray-700"
              htmlFor="password"
            >
              Contraseña
            </label>
          </div>
          <div className="relative">
            <Input
              className="w-full dark:text-black h-13 px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all bg-gray-50 hover:bg-white"
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div aria-live="polite" aria-atomic="true">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full  bg-brand-primary  text-white font-semibold py-3 px-4 rounded-full h-12.5 cursor-pointeractive:scale-[0.98]  disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-alloweddisabled:opacity-100 transition-colors"
          disabled={isPending || password.length === 0 || username.length === 0}
        >
          {isPending ? "Iniciando Sesión..." : "Iniciar Sesión"}
        </button>
      </form>
    </div>
  )
}