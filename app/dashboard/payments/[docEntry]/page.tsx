"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Payment } from '@/types/payments'
import { ArrowLeft, CalendarDots, Coins, CreditCard, FileText, Receipt, Bank, Hash, Info, Printer, DownloadSimple as DownloadSimpleIcon } from "@phosphor-icons/react"
import Avvvatars from "avvvatars-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PDFDownloadLink, pdf } from '@react-pdf/renderer'
import { PaymentReceiptPDF } from '@/components/pdf/PaymentReceiptPDF'

export default function PaymentPage() {
  const [payment, setPayment] = useState<Payment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const { data: session } = useSession()
  const token = session?.user?.token ?? null
  const { docEntry } = useParams()

  useEffect(() => {
    if (!docEntry || !token) return

    const fetchPayment = async () => {
      setIsLoading(true)
      try {
        const { data } = await axios.get(
          `/api-proxy/api/Payments/${docEntry}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setPayment(data)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayment()
  }, [docEntry, token])

  const handlePrint = useCallback(async () => {
    if (!payment) return
    setIsGenerating(true)
    try {
      const blob = await pdf(<PaymentReceiptPDF payment={payment} />).toBlob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Error generating PDF:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [payment])

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 p-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-500 mb-2">
          No se encontró el pago
        </p>
        <Link
          href="/dashboard/payments"
          className="text-brand-primary text-sm font-medium"
        >
          Volver a pagos
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard/payments"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Pagos
        </Link>

        {payment && (
          <div className="flex items-center gap-2">
            <PDFDownloadLink
              document={<PaymentReceiptPDF payment={payment} />}
              fileName={`RECIBO-PAGO-${payment.docNum}-${payment.cardName}.pdf`}
              className="cursor-pointer flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            >
              {({ loading }) =>
                loading ? (
                  <>
                    <DownloadSimpleIcon size={16} />
                    Generando...
                  </>
                ) : (
                  <>
                    <DownloadSimpleIcon size={16} />
                    Descargar
                  </>
                )
              }
            </PDFDownloadLink>

            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className="cursor-pointer flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-brand-primary rounded-xl hover:bg-brand-primary/90 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Printer size={16} />
                  Generando...
                </>
              ) : (
                <>
                  <Printer size={16} />
                  Imprimir
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-semibold text-gray-900">
            Pago #{payment.docNum}
          </h1>
          <Badge variant="secondary">Recibido</Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CalendarDots size={16} />
          {new Date(payment.docDate).toLocaleDateString("es-HN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FACTURAS */}
        <section className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Receipt size={18} />
              Facturas aplicadas
            </h3>

            {payment.invoices.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {payment.invoices.map((invoice) => (
                  <div
                    key={invoice.invoiceDocEntry}
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-100 rounded-lg p-2">
                        <FileText size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Factura #{invoice.invoiceDocNum}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Coins size={12} />
                          Total: L.{" "}
                          {invoice.docTotal.toLocaleString("es-HN")}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-gray-500">
                        Aplicado
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        L.{" "}
                        {invoice.appliedAmount.toLocaleString(
                          "es-HN",
                          { minimumFractionDigits: 2 }
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No hay facturas asociadas a este pago
              </p>
            )}
          </div>
        </section>

        {/* SIDEBAR */}
        <aside className="space-y-6">
          {/* Cliente */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-4">
              Cliente
            </h3>

            <div className="flex items-center gap-3">
              <Avvvatars value={payment.cardName} size={40} />
              <div>
                <p className="font-medium text-gray-900">
                  {payment.cardName}
                </p>
                <p className="text-xs text-gray-500">
                  {payment.cardCode}
                </p>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-4">
              Resumen del pago
            </h3>

            <div className="space-y-3">
              <Row label="Monto del pago" value={payment.total} />

              <Separator />

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Medio</span>
                <div className="flex items-center gap-1">
                  <CreditCard size={14} />
                  <Badge variant="secondary">
                    {payment.paymentMeans}
                  </Badge>
                </div>
              </div>

              {payment.transfer > 0 && (
                <Row label="Transferencia" value={payment.transfer} />
              )}
              {payment.cash > 0 && (
                <Row label="Efectivo" value={payment.cash} />
              )}
              {payment.check > 0 && (
                <Row label="Cheque" value={payment.check} />
              )}
              {payment.credit > 0 && (
                <Row label="Crédito" value={payment.credit} />
              )}
            </div>
          </div>

          {/* DETALLE TRANSFERENCIA */}
          {payment.paymentMeans === "Transfer" &&
            payment.payment?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
                  <Bank size={14} />
                  Detalle de transferencia
                </h3>

                <div className="space-y-3 text-sm">
                  <Detail
                    icon={<Hash size={14} />}
                    label="Referencia"
                    value={payment.payment[0].transferReference}
                  />
                  <Detail
                    icon={<Bank size={14} />}
                    label="Cuenta destino"
                    value={payment.payment[0].transferAccountName}
                  />
                  <Detail
                    icon={<CalendarDots size={14} />}
                    label="Fecha"
                    value={new Date(
                      payment.payment[0].transferDate
                    ).toLocaleDateString("es-HN")}
                  />
                </div>
              </div>
            )}

          {/* CANCELADO */}
          {payment.cancelled === "Y" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <Info size={18} className="text-red-600 mt-0.5" />
              <p className="text-sm font-medium text-red-700">
                Este pago fue cancelado y no tiene efecto contable
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">
        L.{" "}
        {value.toLocaleString("es-HN", {
          minimumFractionDigits: 2,
        })}
      </span>
    </div>
  )
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-medium text-gray-900 text-right">
        {value}
      </span>
    </div>
  )
}