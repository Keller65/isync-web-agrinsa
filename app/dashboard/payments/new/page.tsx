"use client"

import axios from "axios"
import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useInvoiceStore } from "@/lib/store/store.invoice"
import { CustomerType } from "@/types/customers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Trash2 } from "lucide-react"
import { ArrowLeft, User, FileText, CreditCard as CreditCardIcon, BankIcon, ReceiptIcon, MoneyIcon, } from "@phosphor-icons/react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "sonner"

type PaymentMethod = "Efectivo" | "Transferencia" | "Cheque" | "Tarjeta"

interface BankAccount {
  code: string
  name: string
}

interface PaymentSetup {
  banks: { code: string; name: string }[]
  salesPersons: { slpCode: number; cashAccount: string }[]
  bankAccounts: { code: string; name: string }[]
  creditCards: { code: number; name: string; account: string }[]
}

const paymentMethodsConfig: { id: string; label: string; icon: typeof MoneyIcon }[] = [
  { id: "Efectivo", label: "Efectivo", icon: MoneyIcon },
  { id: "Transferencia", label: "Transferencia", icon: BankIcon },
  { id: "Cheque", label: "Cheque", icon: ReceiptIcon },
  { id: "Tarjeta", label: "Tarjeta", icon: CreditCardIcon },
]

function NewPaymentContent() {
  const [customer] = useState<CustomerType | null>(null)
  const [isLoadingCustomer] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentAmountDisplay, setPaymentAmountDisplay] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())
  const [selectedBank, setSelectedBank] = useState("")
  const [amountError, setAmountError] = useState("")

  const [paymentSetup, setPaymentSetup] = useState<PaymentSetup | null>(null)
  const [isLoadingBanks, setIsLoadingBanks] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const token = session?.user?.token ?? null
  const { selectedInvoices, removeInvoice } = useInvoiceStore()

  const cardCode = searchParams.get("cardCode") || ""
  const cardName = decodeURIComponent(searchParams.get("cardName") || "")
  const totalAbonado = selectedInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0)

  useEffect(() => {
    if (!token) return
    setIsLoadingBanks(true)
    axios
      .get<PaymentSetup>(`/api-proxy/api/BankAccounts/PaymentSetup`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => setPaymentSetup(data))
      .catch((err) => console.error("Error fetching PaymentSetup:", err))
      .finally(() => setIsLoadingBanks(false))
  }, [token])

  // Deriva las cuentas según el método activo
  const bankAccounts: BankAccount[] = (() => {
    if (!paymentSetup || !selectedMethod) return []
    switch (selectedMethod) {
      case "Efectivo": {
        const slpCode = (session?.user as any)?.slpCode
        const match = paymentSetup.salesPersons.find((s) => s.slpCode === slpCode)
        const account = match?.cashAccount
        return account ? [{ code: account, name: account }] : []
      }
      case "Transferencia":
        return paymentSetup.bankAccounts
      case "Cheque":
        return paymentSetup.banks
      case "Tarjeta":
        // value = String(code) para que selectedBank sea el creditCardCode numérico
        return paymentSetup.creditCards.map((c) => ({ code: String(c.code), name: c.name }))
      default:
        return []
    }
  })()

  const handleAmountChange = (value: string) => {
    const clean = value.replace(/[^0-9.]/g, "")
    const parts = clean.split(".")

    if (parts.length > 2) return
    if (parts[1] !== undefined && parts[1].length > 2) return

    setPaymentAmount(clean)

    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    const formatted = parts.length === 2 ? `${intPart}.${parts[1]}` : intPart
    setPaymentAmountDisplay(formatted)
    setAmountError("")

    if (clean.trim() !== "") {
      const numValue = parseFloat(clean)
      if (!isNaN(numValue) && numValue < totalAbonado) {
        setAmountError(
          `El monto no puede ser menor al abono total: L. ${totalAbonado.toLocaleString("es-HN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        )
      }
    }
  }

  const isFormComplete =
    selectedMethod === "Efectivo"
      ? Boolean(selectedMethod && paymentAmount && !amountError)
      : Boolean(
        selectedMethod && paymentAmount && referenceNumber && selectedBank && !amountError
      )

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString("es-HN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleDateString("es-HN")
  }


  // Replica exacta de toHondurasISO() de cobro.tsx
  const toHondurasISO = (): string => {
    try {
      const parts = Object.fromEntries(
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Tegucigalpa",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
          .formatToParts(new Date())
          .map((p) => [p.type, p.value])
      ) as Record<string, string>
      return `${parts.year}-${parts.month}-${parts.day}`
    } catch {
      const now = new Date()
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000
      const hond = new Date(utcMs - 6 * 60 * 60 * 1000)
      const pad = (n: number) => String(n).padStart(2, "0")
      return `${hond.getUTCFullYear()}-${pad(hond.getUTCMonth() + 1)}-${pad(hond.getUTCDate())}`
    }
  }

  const buildPayload = (lat: string, long: string) => {
    const amount = parseFloat(paymentAmount)
    const slpCode = Number((session?.user as any)?.salesPersonCode)
    const isCash = selectedMethod === "Efectivo"
    const isCheque = selectedMethod === "Cheque"
    const isTransfer = selectedMethod === "Transferencia"
    const isTarjeta = selectedMethod === "Tarjeta"

    const docDate = isCash || isCheque ? toHondurasISO() : paymentDate.toISOString().split("T")[0]

    const cashAcc = paymentSetup?.salesPersons.find(
      (s) => s.slpCode === slpCode
    )?.cashAccount ?? ""

    const card = paymentSetup?.creditCards.find(
      (c) => String(c.code) === selectedBank
    )

    return {
      appRequestId: crypto.randomUUID(),
      cardCode,
      u_SlpCode: String(slpCode || ""),
      u_Latitud: lat,
      u_Longitud: long,
      docDate,
      cashAccount: isCash ? cashAcc : "",
      cashSum: isCash ? amount : 0,
      checkAccount: isCheque ? selectedBank : "",
      transferAccount: isTransfer ? selectedBank : "",
      transferSum: isTransfer ? amount : 0,
      transferDate: isTransfer ? paymentDate.toISOString().split("T")[0] : null,
      transferReference: isTransfer ? referenceNumber : "",
      paymentChecks: isCheque
        ? [{
          dueDate: paymentDate.toISOString().split("T")[0],
          checkNumber: parseInt(referenceNumber) || 0,
          countryCode: "HN",
          bankCode: selectedBank,
          checkSum: amount,
        }]
        : [],
      paymentInvoices: selectedInvoices.map((inv) => ({
        docEntry: inv.docEntry,
        sumApplied: inv.paidAmount,
        BalanceDue: inv.balanceDue ?? 0,
      })),
      paymentCreditCards: isTarjeta
        ? [{
          creditCard: card?.code ?? 0,
          voucherNum: referenceNumber,
          firstPaymentDue: paymentDate.toISOString().split("T")[0],
          creditSum: amount,
        }]
        : [],
      cancelled: "",
    }
  }

  const handleContinue = async () => {
    if (!selectedMethod || !isFormComplete) return

    const cleanAmount = parseFloat(paymentAmount)
    const roundedPaymentAmount = Math.round(cleanAmount * 100) / 100
    const roundedTotalAbonado = Math.round(totalAbonado * 100) / 100
    const difference = Math.abs(roundedPaymentAmount - roundedTotalAbonado)

    if (difference > 2) {
      const confirmContinue = window.confirm(
        `L. ${difference.toLocaleString("es-HN")} del importe no coinciden con las operaciones existentes. ¿Desea continuar?`
      )
      if (!confirmContinue) return
    }

    setIsSubmitting(true)
    try {
      // Geolocalización — igual que la app, manda vacío si no está disponible
      let lat = ""
      let long = ""
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        )
        lat = pos.coords.latitude.toString()
        long = pos.coords.longitude.toString()
      } catch {
        // No bloquear el cobro si no hay GPS
      }

      const payload = buildPayload(lat, long)
      console.log("Submitting payment:", JSON.stringify(payload, null, 2))
      
      await axios.post("/api-proxy/api/Payments/IncomingPayment", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      
      router.push("/dashboard/payments")
      toast.success("Pago realizo con exito")
    } catch (err) {
      toast.error(`Error al realizar el cobro: ${err}`)
      console.error("Error submitting payment:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!cardCode) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Información del cliente no disponible.</p>
        <Button onClick={() => router.push("/dashboard/payments")} className="mt-4">
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-screen mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Nuevo pago</h2>
          <p className="text-sm text-gray-500">Registrar pago del cliente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: client info and invoices */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-brand-primary size-10 rounded-full flex items-center justify-center">
                <User className="size-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {isLoadingCustomer ? "Cargando..." : cardName}
                </p>
                <p className="text-sm text-gray-500">{cardCode}</p>
              </div>
            </div>

            {customer && (
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">{customer.address}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Facturas seleccionadas</h3>

            {selectedInvoices.length === 0 ? (
              <p className="text-sm text-gray-500">No hay facturas seleccionadas.</p>
            ) : (
              <div className="space-y-3">
                {selectedInvoices.map((inv) => (
                  <div
                    key={inv.docEntry}
                    className="flex flex-col p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" />
                        <span className="text-sm font-medium">{inv.numAtCard}</span>
                        <button
                          onClick={() => removeInvoice(inv.docEntry)}
                          className="flex cursor-pointer items-center gap-1 text-xs text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={12} /> Eliminar
                        </button>
                      </div>
                      <span className="text-sm font-semibold">
                        L. {formatCurrency(inv.paidAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>Saldo pendiente: L. {formatCurrency(inv.balanceDue ?? 0)}</span>
                      <span>Abono: L. {formatCurrency(inv.paidAmount)}</span>
                    </div>
                    <div className="flex items-center justify-start gap-2 text-xs text-gray-400 mt-1">
                      <span>Emisión: {formatDate(inv.docDate)}</span>
                      <span>Vencimiento: {formatDate(inv.docDueDate)}</span>
                    </div>
                  </div>
                ))}

                <div className="pt-3 border-t flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Total a pagar</span>
                  <span className="text-lg font-bold text-brand-primary">
                    L. {formatCurrency(totalAbonado)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: payment method and details */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Método de pago</h3>


            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {paymentMethodsConfig.map((method) => {
                const Icon = method.icon
                const isSelected = selectedMethod === method.id

                return (
                  <button
                    key={method.id}
                    onClick={() => {
                      setSelectedMethod(method.id as PaymentMethod)
                    }}
                    className={`p-4 rounded-xl border-2 transition-colors flex flex-col items-center gap-2 cursor-pointer ${isSelected
                      ? "border-brand-primary bg-blue-50"
                      : "border-gray-200"
                      }`}
                  >
                    <Icon
                      size={28}
                      className={isSelected ? "text-brand-primary" : "text-gray-600"}
                    />
                    <span
                      className={`text-sm font-medium ${isSelected ? "text-brand-primary" : "text-gray-700"
                        }`}
                    >
                      {method.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {selectedMethod && (
            <div className="mt-6 bg-white rounded-2xl p-5 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-5">
                Detalles de {selectedMethod}
              </h3>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-600 mb-2 block">Monto a pagar</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={paymentAmountDisplay}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="text-lg"
                  />
                  {amountError && (
                    <p className="text-red-500 text-xs mt-1">{amountError}</p>
                  )}
                </div>

                {selectedMethod !== "Efectivo" && (
                  <>
                    <div>
                      <Label className="text-gray-600 mb-2 block">
                        {selectedMethod === "Cheque" ? "Número de Cheque" : "Número de Referencia"}
                      </Label>
                      <Input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="Ej: 123456789"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-600 mb-2 block">Fecha de Pago</Label>
                      <DatePicker />
                    </div>

                    <div>
                      <Label className="text-gray-600 mb-2 block">Banco</Label>
                      {isLoadingBanks ? (
                        <Loader2 size={20} className="animate-spin text-gray-400" />
                      ) : (
                        <Select onValueChange={setSelectedBank} defaultValue={selectedBank}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona un Banco" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Bancos</SelectLabel>
                              {bankAccounts.map((bank) => (
                                <SelectItem key={bank.code} value={bank.code}>
                                  {bank.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/payments")}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!isFormComplete || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Procesando...
            </>
          ) : (
            "Registrar pago"
          )}
        </Button>
      </div>
    </div>
  )
}

function Fallback() {
  return (
    <div className="p-8 text-center">
      <Loader2 size={24} className="animate-spin mx-auto text-gray-400" />
    </div>
  )
}

export default function NewPaymentPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <NewPaymentContent />
    </Suspense>
  )
}