"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import axios from "axios"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Button } from "@/components/ui/button"
import { LockKeyIcon } from "@phosphor-icons/react"

export default function TwoFactorSetupPage() {
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

    if (!session?.user?.userId || !session?.user?.manualKey) {
      setErrorMessage("Datos de configuración no disponibles.")
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
          secret: session.user.manualKey,
        }
      )

      const data = response.data
      await update(data)

      if (!data?.success) {
        setErrorMessage(data?.message || "Código incorrecto.")
        return
      }

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

  const qrCode = session?.user?.qrCodeBase64
  const manualKey = session?.user?.manualKey

  const slotClass =
    "w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-lg font-mono font-medium transition-all data-[active=true]:border-brand-primary data-[active=true]:bg-white data-[active=true]:ring-2 data-[active=true]:ring-blue-500/20"

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LockKeyIcon color="white" size={32} />
          </div>

          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
            Autenticación en dos pasos
          </h1>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Escanea el QR con tu app autenticadora
          </p>
        </div>

        {/* QR Code — prominente, sin card */}
        {qrCode && (
          <div className="flex flex-col items-center mb-6">
            <div className="p-3 bg-white rounded-2xl">
              <img
                src={qrCode}
                alt="QR Code para autenticación"
                className="w-56 h-56"
              />
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">Ingresa el código</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* OTP Form */}
        <form onSubmit={handleSubmit}>
          <div className="flex justify-center mb-5">
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

          {errorMessage && (
            <div className="flex items-start gap-2.5 mb-4 px-3.5 py-3 bg-red-50 border border-red-100 rounded-xl">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-px">
                <circle cx="8" cy="8" r="7" stroke="#F43F5E" strokeWidth="1.5" />
                <path d="M8 5v3.5M8 11h.01" stroke="#F43F5E" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-xs text-red-600 leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-2.5">
            <Button
              type="submit"
              disabled={isSubmitting || code.trim().length !== 6}
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Verificando</span>
                </>
              ) : (
                "Confirmar"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              Cancelar
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          ¿Problemas? Contacta a tu administrador.
        </p>
      </div>
    </div>
  )
}