"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { useInvoiceStore } from '@/lib/store/store.invoice'
import { Payment } from '@/types/payments'
import { CustomerType } from '@/types/customers'
import { FileText, CalendarDots, CreditCard, Coins, ArrowClockwise, Plus, } from "@phosphor-icons/react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import Avvvatars from "avvvatars-react"
import Link from "next/link"
import { CustomerSelectionDialog } from "@/components/payments/CustomerSelectionDialog"
import { PendingInvoicesModal } from "@/components/payments/PendingInvoicesModal"
import { useSession } from "next-auth/react"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Customer selection state
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
  const [invoicesModalOpen, setInvoicesModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null)

  const router = useRouter()
  const { data: session } = useSession();
  const { selectedInvoices, clearInvoices } = useInvoiceStore()

  const fetchPayments = async () => {
    setIsLoading(true)
    try {
      const { data } = await axios.get(
        `/api-proxy/api/Payments/received/${session?.user.salesPersonCode}?page=1&pageSize=20`,
        {
          headers: {
            Authorization: `Bearer ${session?.user.token}`,
          },
        }
      )
      setPayments(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [session?.user.token, session?.user.salesPersonCode])

  const handleSelectCustomer = (customer: CustomerType) => {
    clearInvoices()
    setSelectedCustomer(customer)
    setInvoicesModalOpen(true)
  }

  const handleContinueToPayment = () => {
    if (selectedCustomer) {
      setInvoicesModalOpen(false)
      router.push(`/dashboard/payments/new?cardCode=${selectedCustomer.cardCode}&cardName=${encodeURIComponent(selectedCustomer.cardName)}`)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
            Pagos recibidos
          </h2>
          <p className="text-sm text-gray-500">
            Historial reciente de transacciones
          </p>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPayments}
            disabled={isLoading}
            className="gap-2"
          >
            <ArrowClockwise size={16} />
            Actualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setCustomerDialogOpen(true)}
          >
            <Plus size={16} />
            Realizar pago
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-gray-200 space-y-4"
            >
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}

        {!isLoading &&
          payments.map((item) => (
            <Link
              key={item.docEntry}
              href={`/dashboard/payments/${item.docEntry}`}
              className="bg-white dark:bg-dark-card border border-gray-200 dark:border-white/7 rounded-2xl p-5 block hover:border-gray-300 dark:hover:border-white/12 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={22} className="text-gray-700 dark:text-dark-text-secondary" />
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                    Pago{" "}
                    <span className="font-semibold text-gray-900 dark:text-dark-text-primary">
                      #{item.docNum}
                    </span>
                  </p>
                </div>
                <span className="text-xs font-medium bg-brand-primary text-white px-3 py-1 rounded-full">
                  Recibido
                </span>
              </div>

              {/* Cliente */}
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-gray-100 dark:bg-dark-raised size-10 rounded-full overflow-hidden shrink-0">
                  <Avvvatars value={item.cardName} size={40} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-gray-500 dark:text-dark-text-muted">Cliente</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-dark-text-primary truncate">
                    {item.cardName}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                  <div className="bg-gray-100 dark:bg-dark-raised p-1.5 rounded-full">
                    <CalendarDots size={18} className="text-gray-600 dark:text-dark-text-muted" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-dark-text-muted leading-none">
                      Fecha
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary">
                      {new Date(item.docDate).toLocaleDateString("es-HN")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="bg-gray-100 dark:bg-dark-raised p-1.5 rounded-full">
                    <Coins size={18} className="text-gray-600 dark:text-dark-text-muted" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-dark-text-muted leading-none">
                      Total
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-dark-text-primary">
                      L.{" "}
                      {item.total.toLocaleString("es-HN", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Medio de pago */}
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-dark-text-muted">
                <CreditCard size={14} />
                {item.paymentMeans}
              </div>
            </Link>
          ))}
      </div>

      {!isLoading && payments.length === 0 && (
        <div className="py-12 text-center h-[76vh] text-gray-500 flex flex-col items-center justify-center">
          <p className="text-sm">No hay pagos registrados</p>
          <p className="text-xs">
            Los pagos aparecerán aquí automáticamente
          </p>
        </div>
      )}

      <CustomerSelectionDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        onSelectCustomer={handleSelectCustomer}
      />

      {selectedCustomer && (
        <PendingInvoicesModal
          open={invoicesModalOpen}
          onOpenChange={setInvoicesModalOpen}
          customerCode={selectedCustomer.cardCode}
          customerName={selectedCustomer.cardName}
          onContinue={handleContinueToPayment}
        />
      )}
    </div>
  )
}