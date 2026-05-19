"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import axios from "axios"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { LockKeyIcon } from "@phosphor-icons/react"

export default function Page() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [code, setCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.replace("/")
      return
    }
  }, [session, status, router])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage(null)

    if (!session?.user?.userId) {
      setErrorMessage("Usuario no disponible en la sesión.")
      return
    }

    if (code.trim().length !== 6) {
      setErrorMessage("Introduce un código de 6 dígitos.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await axios.post(
        "/api-proxy/api/isync/auth/confirm-2fa",
        {
          userId: session.user.userId,
          code: code.trim(),
          secret: ""
        }
      )

      const data = response.data

      if (!data?.success) {
        setErrorMessage(data?.message || "Código incorrecto.")
        return
      }

      await update(data)

      router.replace("/dashboard")
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Error de conexión. Inténtalo de nuevo."
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  const slotClass =
    "w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-lg font-mono font-medium transition-all data-[active=true]:border-brand-primary data-[active=true]:bg-white data-[active=true]:ring-2 data-[active=true]:ring-blue-500/20"

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-sm p-8">

        {/* Icon */}
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
          <LockKeyIcon size={32} />
        </div>

        {/* Header */}
        <h1 className="text-base font-semibold text-gray-900 tracking-tight mb-1">
          Verificación en dos pasos
        </h1>
        <p className="text-xs text-gray-500 leading-relaxed mb-7">
          Ingresa el código de 6 dígitos de tu app autenticadora para continuar.
        </p>

        <form onSubmit={handleSubmit}>
          {/* OTP Input */}
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(val: string | undefined) => setCode(String(val ?? ""))}
              containerClassName="gap-2"
              autoFocus
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={0} className={slotClass} />
                <InputOTPSlot index={1} className={slotClass} />
                <InputOTPSlot index={2} className={slotClass} />
              </InputOTPGroup>

              <span className="text-gray-300 text-xl font-light select-none px-1">·</span>

              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={3} className={slotClass} />
                <InputOTPSlot index={4} className={slotClass} />
                <InputOTPSlot index={5} className={slotClass} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 mt-5 px-3.5 py-3 bg-red-50 border border-red-100 rounded-xl">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-px">
                <circle cx="8" cy="8" r="7" stroke="#F43F5E" strokeWidth="1.5" />
                <path d="M8 5v3.5M8 11h.01" stroke="#F43F5E" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-xs text-red-600 leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 mt-6">
            <button
              type="submit"
              disabled={isSubmitting || code.trim().length !== 6}
              className="flex-1 cursor-pointer h-11 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Verificando</span>
                </>
              ) : (
                "Confirmar"
              )}
            </button>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="h-11 cursor-pointer px-4 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          ¿Problemas? Contacta a tu administrador.
        </p>
      </div>
    </div>
  )
}